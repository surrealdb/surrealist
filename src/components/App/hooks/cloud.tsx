import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { adapter } from "~/adapter";
import { acquireSession, checkSessionExpiry, invalidateSession } from "~/cloud/api/auth";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { openVerifyEmailModal } from "~/modals/verify-email";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";
import { DeepLinkAuthEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";

const AUTH_MESSAGE_TYPE = "surrealist-auth-callback";

interface AuthFailure {
	error?: string;
	error_description?: string | null | undefined;
}

function isAuthFailure(error: any): error is AuthFailure {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	if ("error" in error && typeof error.error === "string") {
		return true;
	}

	return false;
}

function handleAuthFailure(failure: AuthFailure, signIn: () => Promise<void>) {
	const needsVerification = failure.error_description
		?.toLowerCase()
		.includes("verify your email");

	if (needsVerification) {
		openVerifyEmailModal(signIn);
	} else {
		showErrorNotification({
			title: "Authentication failed",
			content: failure.error_description ?? failure.error ?? "Unknown error",
		});
	}
}

/**
 * Automatically set up the cloud authentication flow
 */
export function useCloudAuthentication() {
	const { isAuthenticated, isLoading, getAccessTokenSilently, handleRedirectCallback, error } =
		useAuth0();

	const { signIn } = useAuthentication();
	const hasInitialised = useRef(false);

	// Handle incoming deeplink callbacks
	const processAuthCallback = useStable(async (callbackUrl: string) => {
		const { setIsProcessingAuth } = useCloudStore.getState();

		try {
			setIsProcessingAuth(true);

			adapter.log("Auth", "Processing auth callback");

			await handleRedirectCallback(callbackUrl);

			const accessToken = await getAccessTokenSilently();

			await acquireSession(accessToken, true);
		} catch (err: any) {
			if (isAuthFailure(err)) {
				handleAuthFailure(err, signIn);
				adapter.warn("Auth", `Authentication was rejected: ${JSON.stringify(err)}`);
			} else {
				adapter.warn("Auth", `Failed to process auth callback: ${JSON.stringify(err)}`);
			}

			invalidateSession();
		} finally {
			setIsProcessingAuth(false);
		}
	});

	// Request SurrealDB Cloud session
	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (isAuthenticated && !hasInitialised.current) {
			hasInitialised.current = true;

			(async () => {
				try {
					const accessToken = await getAccessTokenSilently();
					await acquireSession(accessToken, false);
				} catch (err: any) {
					adapter.warn(
						"Auth",
						`Failed to acquire cloud session on init: ${err?.message ?? err}`,
					);

					invalidateSession();
					useCloudStore.getState().setSessionExpired(true);
				}
			})();
		}
	}, [isAuthenticated, isLoading, getAccessTokenSilently]);

	// Handle Auth0 authentication errors
	useEffect(() => {
		if (isLoading || !isAuthFailure(error)) {
			return;
		}

		handleAuthFailure(error, signIn);
	}, [isLoading, error, signIn]);

	// Check session expiry
	useLayoutEffect(() => {
		const interval = setInterval(checkSessionExpiry, 1000 * 60 * 3);
		return () => clearInterval(interval);
	}, []);

	// Subscribe to deep link auth events
	useEffect(() => {
		const handler = (event: MessageEvent) => {
			if (event.data?.type !== AUTH_MESSAGE_TYPE) return;
			if (event.origin !== window.location.origin) return;

			const callbackUrl = event.data.url as string;

			if (callbackUrl) {
				processAuthCallback(callbackUrl);
			}
		};

		window.addEventListener("message", handler);
		return () => window.removeEventListener("message", handler);
	}, []);

	useEventSubscription(DeepLinkAuthEvent, (callbackUrl) => {
		processAuthCallback(callbackUrl);
	});
}
