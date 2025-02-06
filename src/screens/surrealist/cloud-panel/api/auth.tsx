import { sleep } from "radash";
import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudSignin } from "~/types";
import { isDevelopment } from "~/util/environment";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { showError } from "~/util/helpers";
import { shutdown } from "@intercom/messenger-js-sdk";
import { REFERRER_KEY, REFRESH_TOKEN_KEY, STATE_KEY, VERIFIER_KEY } from "~/util/storage";
import { fetchAPI, updateCloudInformation } from ".";
import { openTermsModal } from "../onboarding/terms-and-conditions";
import { getCloudEndpoints } from "./endpoints";
import { isClientSupported } from "./version";

const CLIENT_ID = import.meta.env.VITE_CLOUD_CLIENT_ID;
const VERIFIER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const CALLBACK_ENDPOINT = isDevelopment
	? "http://localhost:1420/tools/auth-callback.html"
	: import.meta.env.VITE_CLOUD_CALLBACK_URL;

interface PKCE {
	verifier: string;
	challenge: string;
}

(window as any).resetCloudState = () => {
	const { setActiveCloudOrg } = useConfigStore.getState();

	invalidateSession();
	setActiveCloudOrg("");
};

function getState() {
	return useCloudStore.getState().authState;
}

/**
 * Open the cloud authentication page
 */
export async function openCloudAuthentication() {
	const { setIsSupported } = useCloudStore.getState();
	const { authBase } = getCloudEndpoints();
	const isSupported = await isClientSupported();

	// If the client is not supported, disable the cloud
	if (!isSupported) {
		setIsSupported(false);
		return;
	}

	// Wait for the auth state to be determined
	while (getState() === "unknown") {
		await sleep(100);
	}

	// If the user is already authenticated, do nothing
	if (getState() !== "unauthenticated") {
		return;
	}

	const state = adapter.id + randomString(50);
	const pkce = await newPKCE();

	localStorage.setItem(VERIFIER_KEY, pkce.verifier);
	localStorage.setItem(STATE_KEY, state);

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		redirect_uri: CALLBACK_ENDPOINT,
		response_type: "code",
		provider: "authkit",
		code_challenge_method: "S256",
		code_challenge: pkce.challenge,
		scope: "openid profile email offline_access",
		state,
		audience: "https://surrealdb.us.auth0.com/api/v2/",
	});

	adapter.openUrl(`${authBase}/authorize?${params.toString()}`, "internal");
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
		const { authBase } = getCloudEndpoints();

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

		const response = await adapter.fetch(`${authBase}/oauth/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				redirect_uri: CALLBACK_ENDPOINT,
				grant_type: "authorization_code",
				code_verifier: verifier,
				code,
			}),
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
			subtitle: "An error occurred while verifying the authentication details",
		});
	}
}

/**
 * Refresh the current access token
 */
export async function refreshAccess() {
	const { setIsSupported, setLoading, setSessionExpired } = useCloudStore.getState();
	const { authBase } = getCloudEndpoints();
	const isSupported = await isClientSupported();

	if (!isSupported) {
		invalidateSession();
		setIsSupported(false);
		return;
	}

	try {
		const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

		adapter.log("Cloud", "Refreshing cloud access token");

		if (!refreshToken) {
			invalidateSession();
			return;
		}

		setLoading();

		const response = await adapter.fetch(`${authBase}/oauth/token`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				client_id: CLIENT_ID,
				redirect_uri: CALLBACK_ENDPOINT,
				grant_type: "refresh_token",
				refresh_token: refreshToken,
			}),
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
		setSessionExpired(true);
	}
}

/**
 * Attempt to start a new session using the given access token
 */
export async function acquireSession(accessToken: string) {
	try {
		const { setSessionToken, setAuthProvider, setUserId, setSessionExpired } =
			useCloudStore.getState();
		const referralCode = sessionStorage.getItem(REFERRER_KEY);

		adapter.log("Cloud", "Acquiring cloud session");

		let endpoint = "/signin";

		if (referralCode) {
			endpoint += `?referral=${referralCode}`;
		}

		const result = await fetchAPI<CloudSignin>(endpoint, {
			method: "POST",
			body: JSON.stringify(accessToken),
		});

		setSessionToken(result.token);
		setAuthProvider(result.provider);
		setUserId(result.id);

		await updateCloudInformation();

		adapter.log("Cloud", `Session acquired`);
		sessionStorage.removeItem(REFERRER_KEY);
		CloudAuthEvent.dispatch(null);

		setSessionExpired(false);

		if (!result.terms_accepted_at) {
			openTermsModal();
		}
	} catch (err: any) {
		console.error("Failed to acquire session", err);

		invalidateSession();
		showError({
			title: "Failed to authenticate",
			subtitle: "Please try signing into Surreal Cloud again",
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
 * Invalidate the current session and signs out of the account
 */
export function destroySession() {
	const { authBase } = getCloudEndpoints();

	const params = new URLSearchParams({
		client_id: CLIENT_ID,
		returnTo: `${CALLBACK_ENDPOINT}?action=logout&target=${adapter.id}`,
	});

	shutdown();

	adapter.openUrl(`${authBase}/v2/logout?${params.toString()}`, "internal");
}

/**
 * Check for imminent session expiry and attempt to refresh
 */
export function checkSessionExpiry() {
	const { sessionToken } = useCloudStore.getState();

	if (!sessionToken) {
		return;
	}

	// Decode the JWT
	const parts = sessionToken.split(".");

	if (parts.length !== 3) {
		throw new Error("Invalid JWT token");
	}

	// Extract the payload
	// Check if the token is going to expire in the next 5 minutes
	const expriry = JSON.parse(atob(parts[1])).exp;

	if (!expriry) {
		return;
	}

	const now = Date.now() / 1000;

	if (expriry - now < 300) {
		refreshAccess();
	}
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
	const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
	const hashArray = new Uint8Array(hashBuffer);
	const challenge = btoa(String.fromCodePoint(...hashArray))
		.replaceAll("=", "")
		.replaceAll("+", "-")
		.replaceAll("/", "_");

	return {
		verifier,
		challenge,
	};
}
