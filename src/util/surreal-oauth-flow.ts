import { adapter, isDesktop } from "~/adapter";
import { createEventSubscription } from "~/hooks/event";
import type { Authentication } from "~/types";
import { DeepLinkSurrealOAuthEvent } from "./global-events";
import { assertOAuthFeatureEnabled } from "./oauth-feature";
import {
	applyOAuthTokenResponse,
	buildOAuthAuthorizeUrl,
	codeChallengeS256,
	exchangeOAuthCode,
	httpBaseFromConnection,
	randomOAuthString,
	SURREAL_OAUTH_CALLBACK_MESSAGE,
	surrealOAuthRedirectUri,
} from "./surreal-oauth";

const POPUP_TIMEOUT_MS = 180_000;

export class SurrealOAuthFlowError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "SurrealOAuthFlowError";
	}
}

function waitForOAuthCallback(expectedState: string, popup: Window) {
	return new Promise<{ code: string; state: string }>((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			cleanup();
			reject(new SurrealOAuthFlowError("OAuth sign-in timed out"));
		}, POPUP_TIMEOUT_MS);

		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) {
				return;
			}

			if (event.data?.type !== SURREAL_OAUTH_CALLBACK_MESSAGE) {
				return;
			}

			const url = event.data.url as string | undefined;

			if (!url) {
				return;
			}

			let parsed: URL;

			try {
				parsed = new URL(url);
			} catch {
				return;
			}

			const error = parsed.searchParams.get("error");

			if (error) {
				cleanup();
				reject(
					new SurrealOAuthFlowError(
						parsed.searchParams.get("error_description") ?? error,
					),
				);
				return;
			}

			const code = parsed.searchParams.get("code");
			const state = parsed.searchParams.get("state");

			if (!code || !state) {
				return;
			}

			if (state !== expectedState) {
				cleanup();
				reject(new SurrealOAuthFlowError("OAuth state mismatch"));
				return;
			}

			cleanup();
			resolve({ code, state });
		};

		const pollClosed = window.setInterval(() => {
			if (popup.closed) {
				cleanup();
				reject(new SurrealOAuthFlowError("OAuth sign-in was cancelled"));
			}
		}, 500);

		function cleanup() {
			window.clearTimeout(timeout);
			window.clearInterval(pollClosed);
			window.removeEventListener("message", onMessage);
		}

		window.addEventListener("message", onMessage);
	});
}

function waitForSurrealOAuthDeepLink(expectedState: string) {
	return new Promise<{ code: string; state: string }>((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			cleanup();
			reject(new SurrealOAuthFlowError("OAuth sign-in timed out"));
		}, POPUP_TIMEOUT_MS);

		const unsubscribe = createEventSubscription(DeepLinkSurrealOAuthEvent, (callbackUrl) => {
			let parsed: URL;

			try {
				parsed = new URL(callbackUrl);
			} catch {
				return;
			}

			const error = parsed.searchParams.get("error");

			if (error) {
				cleanup();
				reject(
					new SurrealOAuthFlowError(
						parsed.searchParams.get("error_description") ?? error,
					),
				);
				return;
			}

			const code = parsed.searchParams.get("code");
			const state = parsed.searchParams.get("state");

			if (!code || !state) {
				return;
			}

			if (state !== expectedState) {
				cleanup();
				reject(new SurrealOAuthFlowError("OAuth state mismatch"));
				return;
			}

			cleanup();
			resolve({ code, state });
		});

		function cleanup() {
			window.clearTimeout(timeout);
			unsubscribe();
		}
	});
}

/** Run PKCE OAuth sign-in immediately (opens browser popup). */
export async function runSurrealOAuthSignIn(auth: Authentication): Promise<Authentication> {
	assertOAuthFeatureEnabled();

	const base = httpBaseFromConnection(auth.protocol, auth.hostname);

	if (!base) {
		throw new SurrealOAuthFlowError("OAuth requires a remote http/https/ws/wss endpoint");
	}

	const codeVerifier = randomOAuthString(64);
	const codeChallenge = await codeChallengeS256(codeVerifier);
	const state = randomOAuthString(32);
	const redirectUri = surrealOAuthRedirectUri(isDesktop);

	const authorizeUrl = buildOAuthAuthorizeUrl({
		auth,
		base,
		redirectUri,
		state,
		codeChallenge,
	});

	let code: string;

	if (isDesktop) {
		const opened = await adapter.openUrl(authorizeUrl, "external");

		if (!opened) {
			throw new SurrealOAuthFlowError("Could not open a browser window for OAuth");
		}

		({ code } = await waitForSurrealOAuthDeepLink(state));
	} else {
		const popup = window.open(authorizeUrl, "surrealist_oauth", "popup,width=520,height=720");

		if (!popup) {
			const opened = await adapter.openUrl(authorizeUrl, "external");

			if (!opened) {
				throw new SurrealOAuthFlowError("Could not open a browser window for OAuth");
			}

			throw new SurrealOAuthFlowError(
				"Allow pop-ups for Surrealist to complete OAuth, or complete sign-in in the browser tab",
			);
		}

		({ code } = await waitForOAuthCallback(state, popup));

		try {
			popup.close();
		} catch {
			// ignore
		}
	}

	const tokenResponse = await exchangeOAuthCode({
		auth,
		base,
		code,
		redirectUri,
		codeVerifier,
	});

	return applyOAuthTokenResponse(auth, tokenResponse);
}
