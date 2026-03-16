import { shutdown } from "@intercom/messenger-js-sdk";
import { showNotification } from "@mantine/notifications";
import { Icon, iconCheck } from "@surrealdb/ui";
import { adapter, isDesktop } from "~/adapter";
import { useCloudStore } from "~/stores/cloud";
import type { CloudSignin } from "~/types";
import { tagEvent } from "~/util/analytics";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";
import { AWS_MARKETPLACE_KEY, INVITATION_KEY, REFERRER_KEY } from "~/util/storage";
import { openTermsModal } from "../onboarding/terms-and-conditions";
import { ApiError, fetchAPI, updateCloudInformation } from ".";
import { isClientSupported } from "./version";

export interface Auth0Handle {
	loginWithRedirect: (options?: any) => Promise<void>;
	logout: (options?: any) => Promise<void>;
	getAccessTokenSilently: (options?: any) => Promise<string>;
}

/**
 * Open the cloud authentication page via Auth0 SDK
 */
export async function openCloudAuthentication(auth0: Auth0Handle) {
	const { setIsSupported, setFailedConnected } = useCloudStore.getState();
	const versionResponse = await isClientSupported();

	if (versionResponse instanceof Error) {
		console.error(`Failed to fetch Cloud Version: ${versionResponse.message}`);
		setFailedConnected(true);
		return;
	}

	if (!versionResponse) {
		setIsSupported(false);
		return;
	}

	adapter.log("Cloud", "Opening cloud authentication page");

	await auth0.loginWithRedirect({
		openUrl: (url: string) => adapter.openUrl(url, "internal"),
	});
}

/**
 * Acquire a cloud session using the Auth0 access token
 */
export async function refreshCloudSession(auth0: Auth0Handle) {
	const { setIsSupported, setFailedConnected, setLoading, setSessionExpired } =
		useCloudStore.getState();

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
		adapter.log("Cloud", "Refreshing cloud session via Auth0");

		setLoading();

		const accessToken = await auth0.getAccessTokenSilently();

		await acquireSession(accessToken, false);
	} catch (err: any) {
		console.error("Failed to refresh cloud session", err);

		invalidateSession();
		setSessionExpired(true);
	}
}

/**
 * Attempt to start a new session using the given access token
 */
export async function acquireSession(accessToken: string, initial: boolean) {
	const {
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

		setSessionToken(result.token);
		setAuthProvider(result.provider);
		setUserId(result.id);

		await updateCloudInformation();

		adapter.log("Cloud", "Session acquired");
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
				color: "violet",
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
	const { clearSession, sessionToken } = useCloudStore.getState();
	const wasAuthed = !!sessionToken;

	adapter.log("Cloud", "Invalidating active session");

	clearSession();

	if (wasAuthed) {
		CloudExpiredEvent.dispatch(null);
	}
}

/**
 * Invalidate the current session and sign out via Auth0
 */
export function destroySession(auth0: Auth0Handle) {
	shutdown();

	auth0.logout({
		logoutParams: {
			returnTo: isDesktop ? "surrealist://callback/signout" : window.location.origin,
		},
		openUrl: isDesktop
			? (url: string) => adapter.openUrl(url)
			: undefined,
	});

	invalidateSession();
	tagEvent("cloud_signout");
}

/**
 * Check for imminent session expiry and trigger a refresh
 */
export function checkSessionExpiry(auth0: Auth0Handle) {
	const { sessionToken } = useCloudStore.getState();

	if (!sessionToken) {
		return;
	}

	const parts = sessionToken.split(".");

	if (parts.length !== 3) {
		return;
	}

	const expiry = JSON.parse(atob(parts[1])).exp;

	if (!expiry) {
		return;
	}

	const now = Date.now() / 1000;

	if (expiry - now < 300) {
		refreshCloudSession(auth0);
	}
}
