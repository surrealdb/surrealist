import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { broadcastAuthEvent } from "~/util/auth-broadcast";
import { DeepLinkAuthEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";

const AUTH_MESSAGE_TYPE = "surrealist-auth-callback";

interface AuthFailure {
	error?: string;
	error_description?: string | null | undefined;
}

function isAuthFailure(error: unknown): error is AuthFailure {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	if ("error" in error && typeof (error as AuthFailure).error === "string") {
		return true;
	}

	return false;
}

function handleAuthFailure(failure: AuthFailure) {
	showErrorNotification({
		title: "Authentication failed",
		content: failure.error_description ?? failure.error ?? "Unknown error",
	});
}

/**
 * Hook to handle Auth0 redirect callbacks arriving via deep links or postMessage,
 * including Auth0 error responses.
 */
export function useAuthCallbackFlow() {
	const { handleRedirectCallback, error, isLoading } = useAuth0();

	const processAuthCallback = useStable(async (callbackUrl: string) => {
		try {
			adapter.log("Auth", "Processing auth callback");

			await handleRedirectCallback(callbackUrl);
			await broadcastAuthEvent("signin");
		} catch (err: unknown) {
			if (isAuthFailure(err)) {
				handleAuthFailure(err);
				adapter.warn("Auth", `Authentication was rejected: ${JSON.stringify(err)}`);
			} else {
				adapter.warn("Auth", `Failed to process auth callback: ${JSON.stringify(err)}`);
			}
		}
	});

	useEffect(() => {
		if (isLoading || !isAuthFailure(error)) {
			return;
		}

		handleAuthFailure(error);
	}, [isLoading, error]);

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
