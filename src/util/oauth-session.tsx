import type { Authentication } from "~/types";
import { fastParseJwt } from "./helpers";
import { effectiveOAuthUseRefreshToken } from "./surreal-oauth";

function jwtExpiryMs(token: string): number | null {
	const payload = fastParseJwt(token);

	if (!payload?.exp) {
		return null;
	}

	return payload.exp * 1000;
}

export interface OAuthSessionExpiryLines {
	session: string;
	/** Omit refresh row in the menu when null (refresh tokens disabled). */
	refresh: string | null;
	hasSession: boolean;
	hasRefreshToken: boolean;
}

function formatTimeLeft(expiresAt: number | null, now = Date.now()): string {
	if (expiresAt == null) {
		return "Unknown";
	}

	const ms = expiresAt - now;

	if (ms <= 0) {
		return "Expired";
	}

	const sec = Math.floor(ms / 1000);
	const min = Math.floor(sec / 60);
	const hr = Math.floor(min / 60);
	const day = Math.floor(hr / 24);

	if (day >= 1) {
		return `~${day}d left`;
	}

	if (hr >= 1) {
		return `~${hr}h left`;
	}

	if (min >= 1) {
		return `~${min}m left`;
	}

	return `~${sec}s left`;
}

function sessionExpiryMs(auth: Authentication): number | null {
	if (!auth.token?.trim()) {
		return null;
	}

	const jwtExp = jwtExpiryMs(auth.token);

	if (jwtExp != null) {
		return jwtExp;
	}

	return auth.oauthTokenExpiresAt ?? null;
}

function refreshExpiryMs(auth: Authentication): number | null {
	if (!auth.oauthRefreshToken?.trim()) {
		return null;
	}

	return auth.oauthRefreshTokenExpiresAt ?? null;
}

/**
 * Short session / refresh labels for the connection menu.
 */
export function getOAuthSessionExpiryLines(auth: Authentication): OAuthSessionExpiryLines {
	if (auth.mode !== "oauth") {
		return {
			session: "Unavailable",
			refresh: null,
			hasSession: false,
			hasRefreshToken: false,
		};
	}

	const hasSession = !!auth.token?.trim();
	const hasRefreshToken = !!auth.oauthRefreshToken?.trim();

	const session = hasSession ? formatTimeLeft(sessionExpiryMs(auth)) : "Unavailable";

	const refresh = formatRefreshLabel(auth);

	return {
		session,
		refresh,
		hasSession,
		hasRefreshToken,
	};
}

function formatRefreshLabel(auth: Authentication): string | null {
	if (!effectiveOAuthUseRefreshToken(auth)) {
		return null;
	}

	if (!auth.oauthRefreshToken?.trim()) {
		return "Unavailable";
	}

	const expiresAt = refreshExpiryMs(auth);

	if (expiresAt == null) {
		return "Available";
	}

	return formatTimeLeft(expiresAt);
}
