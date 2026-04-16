import { shutdown } from "@intercom/messenger-js-sdk";
import { showNotification } from "@mantine/notifications";
import { Icon, iconCheck } from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { getAccessToken } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";
import type { CloudSignin } from "~/types";
import { tagEvent } from "~/util/analytics";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";
import { AWS_MARKETPLACE_KEY, INVITATION_KEY, REFERRER_KEY } from "~/util/storage";
import { ApiError, fetchAPI, updateCloudInformation } from ".";
import { isClientSupported } from "./version";

/**
 * Refresh the cloud session by silently fetching a new access token
 * from Auth0 and acquiring a fresh cloud session.
 */
export async function refreshCloudSession() {
	const { setSessionExpired } = useCloudStore.getState();

	try {
		adapter.log("Cloud", "Refreshing cloud session via Auth0 SDK");

		const accessToken = await getAccessToken();

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
		clearSession,
		setIsSupported,
		setFailedConnected,
	} = useCloudStore.getState();

	try {
		const versionResponse = await isClientSupported();

		if (versionResponse instanceof Error) {
			console.error(`Failed to fetch Cloud Version: ${versionResponse.message}`);
			setFailedConnected(true);
			return;
		}

		if (!versionResponse) {
			destroySession();
			setIsSupported(false);
			return;
		}

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

		const promptTerms = !result.terms_accepted_at;

		// commented out for testing
		// if (promptTerms) {
		useCloudStore.getState().setOnboardingRequired(true);
		// }

		await updateCloudInformation();

		adapter.log("Cloud", "Session acquired");
		CloudAuthEvent.dispatch(null);

		setAuthError("");
		setSessionExpired(false);

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
		clearSession();

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
 * Invalidate the current cloud session without signing out of Auth0
 */
export function invalidateSession() {
	const { clearSession } = useCloudStore.getState();

	adapter.log("Cloud", "Invalidating active session");

	clearSession();
	CloudExpiredEvent.dispatch(null);
}

/**
 * Sign out of SurrealDB Cloud
 */
export function destroySession() {
	shutdown();
	invalidateSession();
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

	const parts = sessionToken.split(".");

	if (parts.length !== 3) {
		throw new Error("Invalid JWT token");
	}

	const expriry = JSON.parse(atob(parts[1])).exp;

	if (!expriry) {
		return;
	}

	const now = Date.now() / 1000;

	if (expriry - now < 300) {
		refreshCloudSession();
	}
}
