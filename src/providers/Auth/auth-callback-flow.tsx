import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { openVerifyEmailModal } from "~/modals/verify-email";
import { DeepLinkAuthEvent } from "~/util/global-events";
import { showErrorNotification } from "~/util/helpers";
import type { SignInOptions } from "./types";

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

function handleAuthFailure(
	failure: AuthFailure,
	signIn: (options?: SignInOptions) => Promise<void>,
) {
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

export interface AuthCallbackFlowProps {
	signIn: (options?: SignInOptions) => Promise<void>;
}

/**
 * Handles Auth0 redirect callbacks arriving via deep links or postMessage,
 * including email verification UX and Auth0 error responses.
 *
 * Downstream sessions (e.g. the cloud session) observe the resulting Auth0
 * state transitions reactively instead of being driven from here.
 */
export function useAuthCallbackFlow({ signIn }: AuthCallbackFlowProps) {
	const { handleRedirectCallback, error, isLoading } = useAuth0();

	const processAuthCallback = useStable(async (callbackUrl: string) => {
		try {
			adapter.log("Auth", "Processing auth callback");

			await handleRedirectCallback(callbackUrl);
		} catch (err: unknown) {
			if (isAuthFailure(err)) {
				handleAuthFailure(err, signIn);
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

		handleAuthFailure(error, signIn);
	}, [isLoading, error, signIn]);

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
