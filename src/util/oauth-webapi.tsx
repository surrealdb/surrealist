import * as oauth from "oauth4webapi";
import type { Authentication } from "~/types";
import type { OAuthTokenResponse } from "./oauth-core";

export interface OAuthAuthorizationServerMetadata {
	issuer: string;
	authorization_endpoint: string;
	token_endpoint: string;
	response_types_supported?: string[];
	grant_types_supported?: string[];
	code_challenge_methods_supported?: string[];
}

export interface SurrealOAuthPkce {
	codeVerifier: string;
	codeChallenge: string;
}

export function generateOAuthPkce(): Promise<SurrealOAuthPkce> {
	const codeVerifier = oauth.generateRandomCodeVerifier();

	return oauth.calculatePKCECodeChallenge(codeVerifier).then((codeChallenge) => ({
		codeVerifier,
		codeChallenge,
	}));
}

export function generateOAuthState() {
	return oauth.generateRandomState();
}

function httpOptions(url: URL): { [oauth.allowInsecureRequests]?: boolean } {
	if (url.protocol === "http:") {
		return { [oauth.allowInsecureRequests]: true };
	}

	return {};
}

function oauthErrorMessage(err: unknown, fallback: string) {
	if (err instanceof oauth.ResponseBodyError) {
		const description = err.cause.error_description;

		if (typeof description === "string" && description.trim()) {
			return description;
		}

		return err.error ?? fallback;
	}

	if (err instanceof Error) {
		return err.message;
	}

	return fallback;
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

export function mapTokenEndpointResponse(result: oauth.TokenEndpointResponse): OAuthTokenResponse {
	return {
		access_token: result.access_token,
		token_type: result.token_type,
		expires_in: parseExpiresIn(result.expires_in),
		refresh_token: typeof result.refresh_token === "string" ? result.refresh_token : undefined,
		refresh_token_expires_in:
			parseExpiresIn(result.refresh_token_expires_in) ??
			parseExpiresIn(result.refreshTokenExpiresIn),
	};
}

function surrealAuthorizationServer(tokenEndpoint: string): oauth.AuthorizationServer {
	const endpoint = new URL(tokenEndpoint);

	return {
		issuer: endpoint.origin,
		token_endpoint: tokenEndpoint,
	};
}

function surrealOAuthClient(clientId?: string): oauth.Client {
	return { client_id: clientId?.trim() || "surrealist" };
}

function surrealOAuthClientAuth(clientId?: string): oauth.ClientAuth {
	if (clientId?.trim()) {
		return oauth.None();
	}

	return () => {};
}

export async function discoverAuthorizationServerMetadata(
	issuerUrl: string,
	algorithm: "oauth2" | "oidc",
	signal?: AbortSignal,
): Promise<OAuthAuthorizationServerMetadata | null> {
	let issuer: URL;

	try {
		issuer = new URL(issuerUrl.replace(/\/$/, ""));
	} catch {
		return null;
	}

	try {
		const response = await oauth.discoveryRequest(issuer, {
			algorithm,
			signal,
			...httpOptions(issuer),
		});

		if (response.status === 404) {
			return null;
		}

		const metadata = await oauth.processDiscoveryResponse(issuer, response);

		return {
			issuer: metadata.issuer,
			authorization_endpoint: metadata.authorization_endpoint ?? "",
			token_endpoint: metadata.token_endpoint ?? "",
			response_types_supported: metadata.response_types_supported,
			grant_types_supported: metadata.grant_types_supported,
			code_challenge_methods_supported: metadata.code_challenge_methods_supported,
		};
	} catch {
		return null;
	}
}

export async function exchangeAuthorizationCodeGrant(options: {
	tokenEndpoint: string;
	/** Full redirect URL (or its query) returned from the authorize step. */
	callbackUrl: string;
	expectedState: string;
	redirectUri: string;
	codeVerifier: string;
	clientId?: string;
}): Promise<OAuthTokenResponse> {
	const { tokenEndpoint, callbackUrl, expectedState, redirectUri, codeVerifier, clientId } =
		options;
	const as = surrealAuthorizationServer(tokenEndpoint);
	const client = surrealOAuthClient(clientId);
	const clientAuth = surrealOAuthClientAuth(clientId);

	let callbackParameters: URLSearchParams;

	try {
		callbackParameters = oauth.validateAuthResponse(
			as,
			client,
			new URL(callbackUrl),
			expectedState,
		);
	} catch (err) {
		if (err instanceof oauth.AuthorizationResponseError) {
			const params = err.cause;

			if (params instanceof URLSearchParams) {
				const description = params.get("error_description") ?? params.get("error");

				if (description) {
					throw new Error(description);
				}
			}
		}

		throw new Error(oauthErrorMessage(err, "Invalid OAuth callback"));
	}

	try {
		const response = await oauth.authorizationCodeGrantRequest(
			as,
			client,
			clientAuth,
			callbackParameters,
			redirectUri,
			codeVerifier,
			httpOptions(new URL(tokenEndpoint)),
		);

		const result = await oauth.processAuthorizationCodeResponse(as, client, response);

		return mapTokenEndpointResponse(result);
	} catch (err) {
		throw new Error(oauthErrorMessage(err, "Token exchange failed"));
	}
}

export async function refreshOAuthGrant(options: {
	tokenEndpoint: string;
	refreshToken: string;
	clientId?: string;
}): Promise<OAuthTokenResponse> {
	const { tokenEndpoint, refreshToken, clientId } = options;
	const as = surrealAuthorizationServer(tokenEndpoint);
	const client = surrealOAuthClient(clientId);
	const clientAuth = surrealOAuthClientAuth(clientId);

	try {
		const response = await oauth.refreshTokenGrantRequest(
			as,
			client,
			clientAuth,
			refreshToken,
			httpOptions(new URL(tokenEndpoint)),
		);

		const result = await oauth.processRefreshTokenResponse(as, client, response);

		return mapTokenEndpointResponse(result);
	} catch (err) {
		throw new Error(oauthErrorMessage(err, "Token refresh failed"));
	}
}

/** Whether SurrealDB default OAuth should omit `client_id` on token requests. */
export function surrealOAuthClientId(auth: Authentication) {
	if (auth.oauthUseDefault || !auth.access?.trim()) {
		return undefined;
	}

	return auth.access.trim();
}
