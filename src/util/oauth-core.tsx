import type { Authentication } from "~/types";

/** Normalize a redirect URI for comparison (trim whitespace). */
export function normalizeRedirectUri(uri: string) {
	return uri.trim();
}

/** Whether a configured redirect URI list includes the target (trim-aware). */
export function redirectUriListIncludes(redirectUris: string[], target: string) {
	const normalized = normalizeRedirectUri(target);

	return redirectUris.some((uri) => normalizeRedirectUri(uri) === normalized);
}

export interface OAuthTokenResponse {
	access_token: string;
	token_type?: string;
	expires_in?: number;
	refresh_token?: string;
	refresh_token_expires_in?: number;
	error?: string;
	error_description?: string;
}

/**
 * Whether Surrealist should store and use IdP refresh tokens.
 * Explicit `false` opts out; unset on default-OAuth connections opts in.
 */
export function effectiveOAuthUseRefreshToken(auth: Authentication): boolean {
	if (auth.mode !== "oauth") {
		return false;
	}

	if (auth.oauthUseRefreshToken === true) {
		return true;
	}

	if (auth.oauthUseRefreshToken === false) {
		return false;
	}

	return !!auth.oauthUseDefault;
}

export function applyOAuthTokenResponse(
	auth: Authentication,
	response: OAuthTokenResponse,
): Authentication {
	const next: Authentication = {
		...auth,
		token: response.access_token,
	};

	if (effectiveOAuthUseRefreshToken(auth)) {
		if (response.refresh_token) {
			next.oauthRefreshToken = response.refresh_token;
		} else {
			next.oauthRefreshToken = auth.oauthRefreshToken ?? "";
		}

		if (response.refresh_token_expires_in != null && response.refresh_token_expires_in > 0) {
			next.oauthRefreshTokenExpiresAt = Date.now() + response.refresh_token_expires_in * 1000;
		} else if (!response.refresh_token) {
			next.oauthRefreshTokenExpiresAt = auth.oauthRefreshTokenExpiresAt;
		}
	} else {
		next.oauthRefreshToken = "";
		next.oauthRefreshTokenExpiresAt = undefined;
	}

	if (response.expires_in != null && response.expires_in > 0) {
		next.oauthTokenExpiresAt = Date.now() + response.expires_in * 1000;
	}

	return next;
}
