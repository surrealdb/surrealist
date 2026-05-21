import { adapter, isDesktop } from "~/adapter";
import { createEventSubscription } from "~/hooks/event";
import type { Authentication } from "~/types";
import { DeepLinkSurrealOAuthEvent } from "./global-events";
import { parseOAuthCallback } from "./oauth-core";
import { assertOAuthFeatureEnabled } from "./oauth-feature";
import { generateOAuthPkce, generateOAuthState } from "./oauth-webapi";
import {
	applyOAuthTokenResponse,
	buildOAuthAuthorizeUrl,
	exchangeOAuthCode,
	httpBaseFromConnection,
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
	return new Promise<{ callbackUrl: string }>((resolve, reject) => {
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

			const result = parseOAuthCallback(url, expectedState);

			if (result.kind === "incomplete") {
				return;
			}

			cleanup();

			if (result.kind === "error") {
				reject(new SurrealOAuthFlowError(result.message));
				return;
			}

			resolve({ callbackUrl: url });
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
	return new Promise<{ callbackUrl: string }>((resolve, reject) => {
		const timeout = window.setTimeout(() => {
			cleanup();
			reject(new SurrealOAuthFlowError("OAuth sign-in timed out"));
		}, POPUP_TIMEOUT_MS);

		const unsubscribe = createEventSubscription(DeepLinkSurrealOAuthEvent, (callbackUrl) => {
			const result = parseOAuthCallback(callbackUrl, expectedState);

			if (result.kind === "incomplete") {
				return;
			}

			cleanup();

			if (result.kind === "error") {
				reject(new SurrealOAuthFlowError(result.message));
				return;
			}

			resolve({ callbackUrl });
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

	const { codeVerifier, codeChallenge } = await generateOAuthPkce();
	const state = generateOAuthState();
	const redirectUri = surrealOAuthRedirectUri(isDesktop);

	const authorizeUrl = buildOAuthAuthorizeUrl({
		auth,
		base,
		redirectUri,
		state,
		codeChallenge,
	});

	let callbackUrl: string;

	if (isDesktop) {
		const opened = await adapter.openUrl(authorizeUrl, "external");

		if (!opened) {
			throw new SurrealOAuthFlowError("Could not open a browser window for OAuth");
		}

		({ callbackUrl } = await waitForSurrealOAuthDeepLink(state));
	} else {
		const popup = window.open(authorizeUrl, "surrealist_oauth", "popup,width=520,height=720");

		if (!popup) {
			throw new SurrealOAuthFlowError(
				"Allow pop-ups for Surrealist to complete OAuth sign-in",
			);
		}

		({ callbackUrl } = await waitForOAuthCallback(state, popup));

		try {
			popup.close();
		} catch {
			// ignore
		}
	}

	const tokenResponse = await exchangeOAuthCode({
		auth,
		base,
		callbackUrl,
		expectedState: state,
		redirectUri,
		codeVerifier,
	});

	return applyOAuthTokenResponse(auth, tokenResponse);
}
