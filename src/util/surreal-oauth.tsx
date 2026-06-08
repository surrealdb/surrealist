import type { Authentication, Protocol } from "~/types";
import { isDevelopment } from "./environment";
import { fastParseJwt } from "./helpers";
import {
	applyOAuthTokenResponse,
	effectiveOAuthUseRefreshToken,
	type OAuthTokenResponse,
} from "./oauth-core";
import {
	discoverAuthorizationServerMetadata,
	exchangeAuthorizationCodeGrant,
	type OAuthAuthorizationServerMetadata,
	refreshOAuthGrant,
	surrealOAuthClientId,
} from "./oauth-webapi";

export {
	applyOAuthTokenResponse,
	effectiveOAuthUseRefreshToken,
	normalizeRedirectUri,
	type OAuthTokenResponse,
	redirectUriListIncludes,
} from "./oauth-core";
export type { OAuthAuthorizationServerMetadata } from "./oauth-webapi";

/** Deep-link host for desktop instance OAuth (`surrealist://surreal-oauth?…`). */
export const SURREAL_OAUTH_DEEP_LINK_HOST = "surreal-oauth";

const OAUTH_CALLBACK_HOST = import.meta.env.VITE_AUTH0_CALLBACK_HOST;

export interface SurrealOAuthRedirectUriHint {
	id: string;
	label: string;
	description: string;
	uri: string;
}

function oauthCallbackOrigin() {
	if (isDevelopment) {
		return "http://localhost:1420";
	}

	return OAUTH_CALLBACK_HOST ?? (typeof window !== "undefined" ? window.location.origin : "");
}

export function surrealOAuthWebCallbackUri() {
	return `${oauthCallbackOrigin()}/auth/surreal/callback`;
}

/** Hosted page that opens the desktop app (same pattern as cloud `auth/launch`). */
export function surrealOAuthDesktopLaunchUri() {
	return `${oauthCallbackOrigin()}/auth/surreal/launch`;
}

export function surrealOAuthRedirectUri(desktop: boolean) {
	return desktop ? surrealOAuthDesktopLaunchUri() : surrealOAuthWebCallbackUri();
}

export function surrealOAuthRedirectUriHints(): SurrealOAuthRedirectUriHint[] {
	const web = surrealOAuthWebCallbackUri();
	const launch = surrealOAuthDesktopLaunchUri();

	const hints: SurrealOAuthRedirectUriHint[] = [
		{
			id: "web",
			label: "Web",
			description: "Browser popup when using Surrealist on the web or in dev",
			uri: web,
		},
	];

	if (launch !== web) {
		hints.push({
			id: "desktop",
			label: "Desktop",
			description: "System browser → deep link into the desktop app",
			uri: launch,
		});
	}

	return hints;
}

/** postMessage type from `/auth/surreal/callback` popup. */
export const SURREAL_OAUTH_CALLBACK_MESSAGE = "surrealist-surreal-oauth-callback";

const EXPIRE_WARNING_MS = 1000 * 60 * 60 * 3;

export function httpBaseFromConnection(protocol: Protocol, hostname: string): string | null {
	if (!hostname || protocol === "mem" || protocol === "indxdb") {
		return null;
	}

	const trimmed = hostname.trim().replace(/\/$/, "");

	if (protocol === "wss") {
		return `https://${trimmed}`;
	}
	if (protocol === "ws") {
		return `http://${trimmed}`;
	}
	if (protocol === "https" || protocol === "http") {
		return `${protocol}://${trimmed}`;
	}

	return null;
}

export function isRemoteProtocol(protocol: Protocol) {
	return protocol === "http" || protocol === "https" || protocol === "ws" || protocol === "wss";
}

export function hasDefaultOAuthDiscovery(meta: OAuthAuthorizationServerMetadata | null) {
	return !!meta?.authorization_endpoint && !!meta?.token_endpoint;
}

/** Whether RFC 8414 discovery advertises the refresh_token grant. */
export function oauthDiscoverySupportsRefresh(meta: OAuthAuthorizationServerMetadata | null) {
	return meta?.grant_types_supported?.includes("refresh_token") ?? false;
}

export async function fetchOAuthDiscovery(
	base: string,
	signal?: AbortSignal,
): Promise<OAuthAuthorizationServerMetadata | null> {
	return discoverAuthorizationServerMetadata(base, "oauth2", signal);
}

export function oauthDiscoveryDismissKey(httpBase: string) {
	return `surreal-oauth-discovery-dismiss:${httpBase}`;
}

export function isOAuthDiscoveryDismissed(httpBase: string | null) {
	if (!httpBase) {
		return false;
	}

	try {
		return sessionStorage.getItem(oauthDiscoveryDismissKey(httpBase)) === "1";
	} catch {
		return false;
	}
}

export function dismissOAuthDiscovery(httpBase: string | null) {
	if (!httpBase) {
		return;
	}

	try {
		sessionStorage.setItem(oauthDiscoveryDismissKey(httpBase), "1");
	} catch {
		// ignore
	}
}

function oauthAccessPrefix(base: string, ns?: string, db?: string) {
	if (ns && db) {
		return `${base}/access/${encodeURIComponent(ns)}/${encodeURIComponent(db)}`;
	}
	if (ns) {
		return `${base}/access/${encodeURIComponent(ns)}`;
	}
	return `${base}/access`;
}

export function buildOAuthAuthorizeUrl(options: {
	auth: Authentication;
	base: string;
	redirectUri: string;
	state: string;
	codeChallenge: string;
}) {
	const { auth, base, redirectUri, state, codeChallenge } = options;

	if (auth.oauthUseDefault && auth.oauthAuthorizationEndpoint) {
		const url = new URL(auth.oauthAuthorizationEndpoint);
		url.searchParams.set("response_type", "code");
		url.searchParams.set("redirect_uri", redirectUri);
		url.searchParams.set("state", state);
		url.searchParams.set("code_challenge", codeChallenge);
		url.searchParams.set("code_challenge_method", "S256");
		return url.toString();
	}

	const prefix = oauthAccessPrefix(
		base.replace(/\/$/, ""),
		auth.namespace || undefined,
		auth.database || undefined,
	);

	const url = new URL(`${prefix}/authorize`);
	url.searchParams.set("response_type", "code");
	url.searchParams.set("redirect_uri", redirectUri);
	url.searchParams.set("state", state);
	url.searchParams.set("code_challenge", codeChallenge);
	url.searchParams.set("code_challenge_method", "S256");

	if (auth.access) {
		url.searchParams.set("client_id", auth.access);
	}

	return url.toString();
}

export function buildOAuthTokenUrl(auth: Authentication, base: string) {
	if (auth.oauthUseDefault && auth.oauthTokenEndpoint) {
		return auth.oauthTokenEndpoint;
	}

	const prefix = oauthAccessPrefix(
		base.replace(/\/$/, ""),
		auth.namespace || undefined,
		auth.database || undefined,
	);

	const url = new URL(`${prefix}/token`);

	if (auth.access) {
		url.searchParams.set("client_id", auth.access);
	}

	return url.toString();
}

export async function exchangeOAuthCode(options: {
	auth: Authentication;
	base: string;
	callbackUrl: string;
	expectedState: string;
	redirectUri: string;
	codeVerifier: string;
}): Promise<OAuthTokenResponse> {
	const { auth, base, callbackUrl, expectedState, redirectUri, codeVerifier } = options;

	return exchangeAuthorizationCodeGrant({
		tokenEndpoint: buildOAuthTokenUrl(auth, base),
		callbackUrl,
		expectedState,
		redirectUri,
		codeVerifier,
		clientId: surrealOAuthClientId(auth),
	});
}

export async function refreshSurrealOAuthTokens(options: {
	auth: Authentication;
	base: string;
}): Promise<OAuthTokenResponse> {
	const { auth, base } = options;

	if (!auth.oauthRefreshToken) {
		throw new Error("No OAuth refresh token stored");
	}

	return refreshOAuthGrant({
		tokenEndpoint: buildOAuthTokenUrl(auth, base),
		refreshToken: auth.oauthRefreshToken,
		clientId: surrealOAuthClientId(auth),
	});
}

/** Remove stored OAuth credentials from a connection (sign out). */
export function clearOAuthSession(auth: Authentication): Authentication {
	return {
		...auth,
		token: "",
		oauthRefreshToken: "",
		oauthTokenExpiresAt: undefined,
		oauthRefreshTokenExpiresAt: undefined,
	};
}

export function isOAuthJwtExpiringSoon(auth: Authentication) {
	if (!auth.token) {
		return true;
	}

	const payload = fastParseJwt(auth.token);

	if (!payload?.exp) {
		return false;
	}

	const expire = payload.exp * 1000;

	if (expire <= Date.now()) {
		return true;
	}

	return expire - Date.now() < EXPIRE_WARNING_MS;
}

export function needsOAuthRefresh(auth: Authentication) {
	if (auth.mode !== "oauth") {
		return false;
	}

	if (!effectiveOAuthUseRefreshToken(auth)) {
		return false;
	}

	if (!auth.oauthRefreshToken) {
		return false;
	}

	if (!auth.token) {
		return true;
	}

	if (auth.oauthTokenExpiresAt && auth.oauthTokenExpiresAt - Date.now() < EXPIRE_WARNING_MS) {
		return true;
	}

	return isOAuthJwtExpiringSoon(auth);
}

export function hasValidOAuthSession(auth: Authentication) {
	if (auth.mode !== "oauth") {
		return false;
	}

	if (!auth.token) {
		return false;
	}

	const payload = fastParseJwt(auth.token);

	if (!payload?.exp) {
		return true;
	}

	return payload.exp * 1000 > Date.now();
}

export async function ensureOAuthSession(auth: Authentication): Promise<Authentication> {
	if (auth.mode !== "oauth") {
		return auth;
	}

	const base = httpBaseFromConnection(auth.protocol, auth.hostname);

	if (!base) {
		throw new Error("OAuth requires an http, https, ws, or wss endpoint");
	}

	if (hasValidOAuthSession(auth) && !needsOAuthRefresh(auth)) {
		return auth;
	}

	if (needsOAuthRefresh(auth)) {
		try {
			const refreshed = await refreshSurrealOAuthTokens({ auth, base });
			return applyOAuthTokenResponse(auth, refreshed);
		} catch {
			// Fall through — caller may start interactive sign-in
		}
	}

	if (!hasValidOAuthSession(auth)) {
		throw new Error("OAuth sign-in required");
	}

	return auth;
}

/** Access name is required when scoping OAuth to a namespace and/or database. */
export function isOAuthAccessRequired(auth: Authentication) {
	if (auth.mode !== "oauth" || auth.oauthUseDefault) {
		return false;
	}

	return !!(auth.namespace?.trim() || auth.database?.trim());
}

export function isOAuthConnectionValid(auth: Authentication) {
	if (auth.mode !== "oauth") {
		return false;
	}

	if (!auth.protocol || !auth.hostname) {
		return false;
	}

	if (auth.oauthUseDefault) {
		return true;
	}

	if (isOAuthAccessRequired(auth)) {
		return !!auth.access?.trim();
	}

	return true;
}
