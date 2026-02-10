import { shutdown } from "@intercom/messenger-js-sdk";
import { showNotification } from "@mantine/notifications";
import { Icon } from "@surrealdb/ui";
import { sleep } from "radash";
import { adapter } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import type { CloudSignin } from "~/types";
import { tagEvent } from "~/util/analytics";
import { isDevelopment } from "~/util/environment";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { fastParseJwt, showErrorNotification } from "~/util/helpers";
import { iconCheck } from "~/util/icons";
import {
	AWS_MARKETPLACE_KEY,
	INVITATION_KEY,
	REFERRER_KEY,
	STATE_KEY,
	TOKEN_ACCESS_KEY,
	TOKEN_REFRESH_KEY,
	VERIFIER_KEY,
} from "~/util/storage";
import { openTermsModal } from "../onboarding/terms-and-conditions";
import { ApiError, fetchAPI, updateCloudInformation } from ".";
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

function getState() {
	return useCloudStore.getState().authState;
}

/**
 * Open the cloud authentication page
 */
export async function openCloudAuthentication() {
	const { setIsSupported, setFailedConnected } = useCloudStore.getState();
	const { authBase } = getCloudEndpoints();
	const versionResponse = await isClientSupported();

	if (versionResponse instanceof Error) {
		console.error(`Failed to fetch Cloud Version: ${versionResponse.message}`);
		setFailedConnected(true);
		return;
	}

	// If the client is not supported, disable the cloud
	if (!versionResponse) {
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

	adapter.log("Cloud", `Opening cloud authentication page (re: ${CALLBACK_ENDPOINT})`);

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

		localStorage.setItem(TOKEN_REFRESH_KEY, result.refresh_token);
		localStorage.setItem(TOKEN_ACCESS_KEY, result.access_token);

		acquireSession(result.access_token, true);
	} catch (err: any) {
		console.error("Failed to verify authentication", err);

		invalidateSession();
		showErrorNotification({
			title: "Authentication failed",
			content: "Could not verify the authentication details",
		});
	}
}

/**
 * Refresh the current access token
 */
export async function refreshAccess() {
	const { setIsSupported, setFailedConnected, setLoading, setSessionExpired } =
		useCloudStore.getState();
	const { authBase } = getCloudEndpoints();
	const versionResponse = await isClientSupported();

	if (versionResponse instanceof Error) {
		console.error(`Failed to fetch Cloud Version: ${versionResponse.message}`);
		setFailedConnected(true);
		invalidateSession();
		return;
	}

	if (!versionResponse) {
		invalidateSession();
		setIsSupported(false);
		return;
	}

	try {
		const refreshToken = localStorage.getItem(TOKEN_REFRESH_KEY);
		const accessToken = localStorage.getItem(TOKEN_ACCESS_KEY);

		adapter.log("Cloud", "Refreshing cloud access token");

		if (!refreshToken) {
			invalidateSession();
			return;
		}

		setLoading();

		if (accessToken && fastParseJwt(accessToken).exp > Date.now() / 1000) {
			adapter.log("Cloud", "Access token is still valid, skipping refresh");
			acquireSession(accessToken, false);
			return;
		}

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

		localStorage.setItem(TOKEN_REFRESH_KEY, result.refresh_token);
		localStorage.setItem(TOKEN_ACCESS_KEY, result.access_token);

		acquireSession(result.access_token, false);
	} catch (err: any) {
		console.error("Failed to refresh access token", err);

		invalidateSession();
		setSessionExpired(true);
	}
}

/**
 * Attempt to start a new session using the given access token
 */
export async function acquireSession(accessToken: string, initial: boolean) {
	const {
		setAccessToken,
		setSessionToken,
		setAuthProvider,
		setUserId,
		setSessionExpired,
		setAuthError,
	} = useCloudStore.getState();

	try {
		const referralCode = sessionStorage.getItem(REFERRER_KEY);
		const invitationCode = sessionStorage.getItem(INVITATION_KEY);
		const awsMarketplaceCode = sessionStorage.getItem(AWS_MARKETPLACE_KEY);

		adapter.log("Cloud", "Acquiring cloud session");

		const params = new URLSearchParams();

		if (referralCode) {
			params.append("referral", referralCode);
		}

		if (invitationCode) {
			params.append("invitation", invitationCode);
		}

		if (awsMarketplaceCode) {
			params.append("aws_token", awsMarketplaceCode);
		}

		const result = await fetchAPI<CloudSignin>(`/signin?${params}`, {
			method: "POST",
			body: JSON.stringify(accessToken),
		});

		setAccessToken(accessToken);
		setSessionToken(result.token);
		setAuthProvider(result.provider);
		setUserId(result.id);

		await updateCloudInformation();

		adapter.log("Cloud", `Session acquired`);
		CloudAuthEvent.dispatch(null);

		setAuthError("");
		setSessionExpired(false);

		const promptTerms = !result.terms_accepted_at;

		if (promptTerms) {
			openTermsModal();
		}

		if (initial) {
			tagEvent("cloud_signin", {
				auth_provider: result.provider,
				referred: !!referralCode,
				open_terms: promptTerms,
				first_signin: promptTerms,
			});
		}

		if (invitationCode) {
			showNotification({
				color: "surreal",
				title: "Invitation accepted",
				message: "You have joined the organisation",
				icon: <Icon path={iconCheck} />,
			});
		}
	} catch (err: any) {
		console.error("Failed to acquire session", err);

		setAuthError(err.message);

		if (err instanceof ApiError && err.status === 422) {
			showErrorNotification({
				title: "Already in organisation",
				content: "You are already a member of this organisation",
			});
		} else {
			showErrorNotification({
				title: "Failed to authenticate",
				content: "Please try signing into SurrealDB Cloud again",
			});
		}
	} finally {
		sessionStorage.removeItem(REFERRER_KEY);
		sessionStorage.removeItem(INVITATION_KEY);
		sessionStorage.removeItem(AWS_MARKETPLACE_KEY);
	}
}

/**
 * Invalidate the current session
 */
export function invalidateSession() {
	const { clearSession } = useCloudStore.getState();
	const wasAuthed = !!localStorage.getItem(TOKEN_REFRESH_KEY);

	adapter.log("Cloud", "Invalidating active session");

	localStorage.removeItem(TOKEN_REFRESH_KEY);
	localStorage.removeItem(TOKEN_ACCESS_KEY);

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
	tagEvent("cloud_signout");
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
