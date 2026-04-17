import { useAuth0 } from "@auth0/auth0-react";
import { AuthenticationError } from "@auth0/auth0-spa-js";
import { useEffect, useLayoutEffect, useRef } from "react";
import { adapter } from "~/adapter";
import { acquireSession, checkSessionExpiry, invalidateSession } from "~/cloud/api/auth";
import { useEventSubscription } from "~/hooks/event";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { openVerifyEmailModal } from "~/modals/verify-email";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";
import { DeepLinkAuthEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";

const AUTH_MESSAGE_TYPE = "surrealist-auth-callback";

/**
 * Extract auth error details from a callback URL, if any.
 */
function extractAuthError(callbackUrl: string) {
	const url = new URL(callbackUrl);
	const error = url.searchParams.get("error");
	const errorDescription = url.searchParams.get("error_description");

	if (!error && !errorDescription) {
		return null;
	}

	return { error, errorDescription };
}

function notifyAuthCallbackDenied(
	error: string | null,
	errorDescription: string | null | undefined,
	signIn: () => Promise<void>,
) {
	if (!error && !errorDescription) {
		return;
	}

	const needsVerification = errorDescription?.toLowerCase().includes("verify your email");

	if (needsVerification) {
		openVerifyEmailModal(signIn);
	} else {
		showErrorNotification({
			title: "Authentication failed",
			content: errorDescription ?? error ?? "Unknown error",
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
	const [, navigate] = useAbsoluteLocation();
	const hasInitialised = useRef(false);
	const handledRedirectDeniedKey = useRef<string | null>(null);

	const processAuthCallback = useStable(async (callbackUrl: string) => {
		const { setIsProcessingAuth } = useCloudStore.getState();
		const authError = extractAuthError(callbackUrl);

		if (authError) {
			notifyAuthCallbackDenied(authError.error, authError.errorDescription, signIn);

			return;
		}

		try {
			setIsProcessingAuth(true);
			adapter.log("Cloud", "Processing auth callback");

			await handleRedirectCallback(callbackUrl);

			const accessToken = await getAccessTokenSilently();

			await acquireSession(accessToken, true);
		} catch (err: any) {
			console.error("Failed to process auth callback", err);
			invalidateSession();
		} finally {
			setIsProcessingAuth(false);
		}
	});

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
					console.error("Failed to acquire cloud session on init", err);
				}
			})();
		}
	}, [isAuthenticated, isLoading, getAccessTokenSilently]);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (!error) {
			handledRedirectDeniedKey.current = null;
			return;
		}

		if (!(error instanceof AuthenticationError)) {
			return;
		}

		const dedupeKey = `${error.error}\0${error.error_description ?? ""}`;
		if (handledRedirectDeniedKey.current === dedupeKey) {
			return;
		}

		handledRedirectDeniedKey.current = dedupeKey;
		notifyAuthCallbackDenied(error.error, error.error_description, signIn);
		navigate(`${window.location.pathname}${window.location.hash}`, { replace: true });
	}, [isLoading, error, signIn]);

	useLayoutEffect(() => {
		const interval = setInterval(checkSessionExpiry, 1000 * 60 * 3);
		return () => clearInterval(interval);
	}, []);

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
