import { useInterfaceStore } from "~/stores/interface";
import type { Authentication, Connection } from "~/types";
import { assertOAuthFeatureEnabled } from "./oauth-feature";
import { OAuthSignInCancelled, requestOAuthSignIn } from "./oauth-signin-prompt";
import { ensureOAuthSession, isOAuthAccessRequired } from "./surreal-oauth";
import { runSurrealOAuthSignIn, SurrealOAuthFlowError } from "./surreal-oauth-flow";

export class OAuthConnectError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OAuthConnectError";
	}
}

/**
 * Ensure OAuth credentials are ready before connecting.
 * Refreshes tokens when possible; otherwise prompts via the connect-time modal.
 */
export async function resolveOAuthForConnect(connection: Connection): Promise<Authentication> {
	const auth = connection.authentication;

	if (auth.mode !== "oauth") {
		return auth;
	}

	assertOAuthFeatureEnabled();

	if (isOAuthAccessRequired(auth) && !auth.access?.trim()) {
		throw new OAuthConnectError(
			"Access method name is required when a namespace or database is specified",
		);
	}

	if (auth.token || auth.oauthRefreshToken) {
		try {
			return await ensureOAuthSession(auth);
		} catch {
			// Expired or refresh failed — fall through to interactive sign-in
		}
	}

	const { openOAuthSignIn } = useInterfaceStore.getState();
	openOAuthSignIn();

	return requestOAuthSignIn(connection);
}

export function isOAuthSignInCancelled(err: unknown) {
	return err instanceof OAuthSignInCancelled;
}

/**
 * Interactive OAuth sign-in without the connect-time modal or session reuse.
 * Use for explicit re-authentication from the connection menu.
 */
export async function interactiveOAuthSignIn(auth: Authentication): Promise<Authentication> {
	if (auth.mode !== "oauth") {
		return auth;
	}

	assertOAuthFeatureEnabled();

	if (isOAuthAccessRequired(auth) && !auth.access?.trim()) {
		throw new OAuthConnectError(
			"Access method name is required when a namespace or database is specified",
		);
	}

	try {
		return await runSurrealOAuthSignIn(auth);
	} catch (err) {
		if (err instanceof SurrealOAuthFlowError) {
			throw new OAuthConnectError(err.message);
		}

		throw err;
	}
}
