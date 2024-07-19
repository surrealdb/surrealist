import { adapter } from "~/adapter";
import { showError } from "~/util/helpers";
import { useCloudStore } from "~/stores/cloud";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { REFRESH_TOKEN_KEY, STATE_KEY, VERIFIER_KEY } from "~/util/storage";
import { isDevelopment } from "~/util/environment";
import { fetchAPI, updateCloudInformation } from "./api";
import { getSetting } from "~/util/config";

const CLIENT_ID = import.meta.env.VITE_CLOUD_CLIENT_ID;
const VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

const CALLBACK_ENDPOINT = isDevelopment
	? "http://localhost:1420/cloud/callback/index.html"
	: `https://${location.host}/cloud/callback`;

interface PKCE {
	verifier: string;
	challenge: string;
}

/**
 * Open the cloud authentication page
 */
export async function openCloudAuthentication() {
	const baseUrl = getSetting("cloud", "urlAuthBase");
	const state = adapter.id + randomString(50);
	const pkce = await newPKCE();

	localStorage.setItem(VERIFIER_KEY, pkce.verifier);
	localStorage.setItem(STATE_KEY, state);

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: CALLBACK_ENDPOINT,
		response_type: 'code',
		provider: 'authkit',
		code_challenge_method: 'S256',
		code_challenge: pkce.challenge,
		scope: 'openid profile email offline_access',
		state,
		audience: 'https://surrealdb.us.auth0.com/api/v2/',
	});

	adapter.openUrl(`${baseUrl}/authorize?${params.toString()}`, "internal");
}

/**
 * Verify the authentication process using the provided
 * code and state values.
 *
 * @param code The response code
 * @param state The response state
 */
export async function verifyAuthentication(code: string, state: string) {
	try {
		const { setLoading } = useCloudStore.getState();
		const baseUrl = getSetting("cloud", "urlAuthBase");

		adapter.log("Cloud", "Verifying authentication details");

		const verifier = localStorage.getItem(VERIFIER_KEY);
		const checkState = localStorage.getItem(STATE_KEY);

		localStorage.removeItem(VERIFIER_KEY);
		localStorage.removeItem(STATE_KEY);

		if (state !== checkState) {
			throw new Error("Invalid authentication state");
		}

		if (!verifier) {
			throw new Error("Invalid authentication verifier");
		}

		setLoading();

		const response = await adapter.fetch(`${baseUrl}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				redirect_uri: CALLBACK_ENDPOINT,
				grant_type: "authorization_code",
				code_verifier: verifier,
				code,
			})
		});

		const result = await response.json();

		if (!result || result.error) {
			throw new Error(`Invalid authentication response: ${result.error}`);
		}

		localStorage.setItem(REFRESH_TOKEN_KEY, result.refresh_token);

		acquireSession(result.access_token);
	} catch (err: any) {
		console.error("Failed to verify authentication", err);

		invalidateSession();
		showError({
			title: "Authentication failed",
			subtitle: "An error occurred while verifying the authentication details"
		});
	}
}

/**
 * Refresh the current access token
 */
export async function refreshAccess() {
	try {
		const { setLoading } = useCloudStore.getState();
		const baseUrl = getSetting("cloud", "urlAuthBase");
		const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

		adapter.log("Cloud", "Refreshing cloud access token");

		if (!refreshToken) {
			invalidateSession();
			return;
		}

		setLoading();

		const response = await adapter.fetch(`${baseUrl}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				redirect_uri: CALLBACK_ENDPOINT,
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			})
		});

		const result = await response.json();

		if (!result || result.error) {
			throw new Error(`Invalid authentication response: ${result.error}`);
		}

		localStorage.setItem(REFRESH_TOKEN_KEY, result.refresh_token);

		acquireSession(result.access_token);
	} catch (err: any) {
		console.error("Failed to refresh access token", err);

		invalidateSession();
		showError({
			title: "Authentication expired",
			subtitle: "Please re-authenticate to Surreal Cloud"
		});
	}
}

/**
 * Attempt to start a new session using the given access token
 */
export async function acquireSession(accessToken: string) {
	try {
		const { setSessionToken } = useCloudStore.getState();

		adapter.log("Cloud", "Acquiring cloud session");

		const result = await fetchAPI<any>("/signin", {
			method: 'POST',
			body: JSON.stringify(accessToken)
		});

		setSessionToken(result.token);
		await updateCloudInformation();

		adapter.log("Cloud", `Session acquired`);
		CloudAuthEvent.dispatch(null);
	} catch (err: any) {
		console.error("Failed to acquire session", err);

		invalidateSession();
		showError({
			title: "Authentication failed",
			subtitle: "An unexpected error occurred while authenticating to Surreal Cloud"
		});
	}
}

/**
 * Invalidate the current session
 */
export function invalidateSession() {
	const { clearSession } = useCloudStore.getState();
	const wasAuthed = !!localStorage.getItem(REFRESH_TOKEN_KEY);

	adapter.log("Cloud", "Invalidating active session");

	localStorage.removeItem(REFRESH_TOKEN_KEY);

	clearSession();

	if (wasAuthed) {
		CloudExpiredEvent.dispatch(null);
	}
}

/**
 * Check for imminent session expiry and attempt to refresh
 */
export function checkSessionExpiry() {
	const { sessionToken } = useCloudStore.getState();

	if (!sessionToken) {
		return;
	}

	// // Decode the JWT
	// const parts = sessionToken.split('.');

	// if (parts.length !== 3) {
	// 	throw new Error('Invalid JWT token');
	// }

	// // Extract the payload
	// // Check if the token is going to expire in the next 5 minutes
	// const expriry = JSON.parse(atob(parts[1])).exp;

	// if (!expriry) {
	// 	return;
	// }

	// const now = Date.now() / 1000;

	// if (expriry - now < 300) {
	// 	refreshSession();
	// }
}

function randomString(n: number): string {
	let b = "";

	for (let i = 0; i < n; i++) {
		const y = Math.floor(Math.random() * VERIFIER_CHARS.length);
		b += VERIFIER_CHARS[y];
	}

	return b;
}

async function newPKCE(): Promise<PKCE> {
	const verifier = randomString(50);
	const encoded = new TextEncoder().encode(verifier);
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = new Uint8Array(hashBuffer);
	const challenge = btoa(String.fromCodePoint(...hashArray))
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");

	return {
		verifier,
		challenge
	};
}
