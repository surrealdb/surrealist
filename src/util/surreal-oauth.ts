import type { Authentication, Protocol } from "~/types";
import { isDevelopment } from "./environment";
import { fastParseJwt } from "./helpers";

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

/** URIs to register on `DEFINE ACCESS … REDIRECT_URIS`. */
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

export interface OAuthAuthorizationServerMetadata {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	response_types_supported?: string[];
	grant_types_supported?: string[];
	code_challenge_methods_supported?: string[];
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

export async function fetchOAuthDiscovery(
	base: string,
	signal?: AbortSignal,
): Promise<OAuthAuthorizationServerMetadata | null> {
	const url = `${base.replace(/\/$/, "")}/.well-known/oauth-authorization-server`;

	try {
		const res = await fetch(url, { method: "GET", signal });

		if (res.status === 404) {
			return null;
		}

		if (!res.ok) {
			return null;
		}

		return (await res.json()) as OAuthAuthorizationServerMetadata;
	} catch {
		return null;
	}
}

export function oauthDiscoveryDismissKey(hostname: string) {
	return `surreal-oauth-discovery-dismiss:${hostname}`;
}

export function isOAuthDiscoveryDismissed(hostname: string) {
	try {
		return sessionStorage.getItem(oauthDiscoveryDismissKey(hostname)) === "1";
	} catch {
		return false;
	}
}

export function dismissOAuthDiscovery(hostname: string) {
	try {
		sessionStorage.setItem(oauthDiscoveryDismissKey(hostname), "1");
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

function encodeFormBody(pairs: [string, string][]) {
	return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
}

function parseExpiresIn(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}

	if (typeof value === "string" && value.trim()) {
		const parsed = Number(value);

		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	return undefined;
}

/** Normalize SurrealDB `/access/token` JSON (RFC 6749 + optional refresh lifetime). */
export function parseOAuthTokenResponse(data: unknown): OAuthTokenResponse {
	const raw = (data ?? {}) as Record<string, unknown>;

	return {
		access_token: String(raw.access_token ?? ""),
		token_type: typeof raw.token_type === "string" ? raw.token_type : undefined,
		expires_in: parseExpiresIn(raw.expires_in),
		refresh_token: typeof raw.refresh_token === "string" ? raw.refresh_token : undefined,
		refresh_token_expires_in:
			parseExpiresIn(raw.refresh_token_expires_in) ??
			parseExpiresIn(raw.refreshTokenExpiresIn),
		error: typeof raw.error === "string" ? raw.error : undefined,
		error_description:
			typeof raw.error_description === "string" ? raw.error_description : undefined,
	};
}

export async function exchangeOAuthCode(options: {
	auth: Authentication;
	base: string;
	code: string;
	redirectUri: string;
	codeVerifier: string;
}): Promise<OAuthTokenResponse> {
	const { auth, base, code, redirectUri, codeVerifier } = options;
	const tokenUrl = buildOAuthTokenUrl(auth, base);

	const body: [string, string][] = [
		["grant_type", "authorization_code"],
		["code", code],
		["redirect_uri", redirectUri],
		["code_verifier", codeVerifier],
	];

	if (!auth.oauthUseDefault && auth.access) {
		body.push(["client_id", auth.access]);
	}

	const res = await fetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: encodeFormBody(body),
	});

	const data = parseOAuthTokenResponse(await res.json());

	if (!res.ok) {
		throw new Error(
			data.error_description ?? data.error ?? `Token exchange failed (${res.status})`,
		);
	}

	return data;
}

export async function refreshSurrealOAuthTokens(options: {
	auth: Authentication;
	base: string;
}): Promise<OAuthTokenResponse> {
	const { auth, base } = options;

	if (!auth.oauthRefreshToken) {
		throw new Error("No OAuth refresh token stored");
	}

	const tokenUrl = buildOAuthTokenUrl(auth, base);
	const body: [string, string][] = [
		["grant_type", "refresh_token"],
		["refresh_token", auth.oauthRefreshToken],
	];

	if (!auth.oauthUseDefault && auth.access) {
		body.push(["client_id", auth.access]);
	}

	const res = await fetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: encodeFormBody(body),
	});

	const data = parseOAuthTokenResponse(await res.json());

	if (!res.ok) {
		throw new Error(
			data.error_description ?? data.error ?? `Token refresh failed (${res.status})`,
		);
	}

	return data;
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
		next.oauthRefreshToken = response.refresh_token ?? "";

		if (response.refresh_token_expires_in != null && response.refresh_token_expires_in > 0) {
			next.oauthRefreshTokenExpiresAt = Date.now() + response.refresh_token_expires_in * 1000;
		} else if (!response.refresh_token) {
			next.oauthRefreshTokenExpiresAt = undefined;
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

export function randomOAuthString(length: number) {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let out = "";

	for (const b of bytes) {
		out += alphabet[b % alphabet.length];
	}

	return out;
}

function base64UrlEncode(buffer: ArrayBuffer) {
	const bytes = new Uint8Array(buffer);
	let binary = "";

	for (const b of bytes) {
		binary += String.fromCharCode(b);
	}

	return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** RFC 7636 S256 code challenge (matches SurrealDB `code_challenge_s256`). */
export async function codeChallengeS256(verifier: string) {
	const data = new TextEncoder().encode(verifier);
	const hash = await crypto.subtle.digest("SHA-256", data);
	return base64UrlEncode(hash);
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
