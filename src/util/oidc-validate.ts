import * as oauth from "oauth4webapi";

export interface OidcDiscoveryValidationSuccess {
	ok: true;
	issuer: string;
	authorizationEndpoint?: string;
	tokenEndpoint?: string;
	jwksUri?: string;
	grantTypesSupported?: string[];
}

export interface OidcDiscoveryValidationFailure {
	ok: false;
	error: string;
}

export type OidcDiscoveryValidationResult =
	| OidcDiscoveryValidationSuccess
	| OidcDiscoveryValidationFailure;

export interface JwksValidationSuccess {
	ok: true;
	keyCount: number;
}

export interface JwksValidationFailure {
	ok: false;
	error: string;
}

export type JwksValidationResult = JwksValidationSuccess | JwksValidationFailure;

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

	if (err instanceof oauth.OperationProcessingError) {
		return err.message;
	}

	if (err instanceof Error) {
		return err.message;
	}

	return fallback;
}

function parseJwksKeys(data: unknown): number | null {
	if (typeof data !== "object" || data === null || !("keys" in data)) {
		return null;
	}

	const keys = (data as { keys?: unknown }).keys;

	if (!Array.isArray(keys)) {
		return null;
	}

	const validKeys = keys.filter(
		(key) =>
			typeof key === "object" &&
			key !== null &&
			typeof (key as { kty?: unknown }).kty === "string",
	);

	return validKeys.length > 0 ? validKeys.length : null;
}

/** Validate an OIDC issuer by fetching `/.well-known/openid-configuration`. */
export async function validateOidcIssuerDiscovery(
	issuerUrl: string,
	signal?: AbortSignal,
): Promise<OidcDiscoveryValidationResult> {
	let issuer: URL;

	try {
		issuer = new URL(issuerUrl.trim().replace(/\/$/, ""));
	} catch {
		return { ok: false, error: "Issuer URL is not valid" };
	}

	try {
		const response = await oauth.discoveryRequest(issuer, {
			algorithm: "oidc",
			signal,
			...httpOptions(issuer),
		});

		const metadata = await oauth.processDiscoveryResponse(issuer, response);

		return {
			ok: true,
			issuer: metadata.issuer,
			authorizationEndpoint: metadata.authorization_endpoint,
			tokenEndpoint: metadata.token_endpoint,
			jwksUri: metadata.jwks_uri,
			grantTypesSupported: metadata.grant_types_supported,
		};
	} catch (err) {
		return {
			ok: false,
			error: oauthErrorMessage(err, "OIDC discovery failed"),
		};
	}
}

/** Fetch and validate a JWKS document URL. */
export async function validateJwksUrl(
	jwksUrl: string,
	signal?: AbortSignal,
): Promise<JwksValidationResult> {
	let url: URL;

	try {
		url = new URL(jwksUrl.trim());
	} catch {
		return { ok: false, error: "JWKS URL is not valid" };
	}

	try {
		const response = await fetch(url.href, {
			headers: { Accept: "application/json" },
			signal,
		});

		if (!response.ok) {
			return { ok: false, error: `JWKS request failed (${response.status})` };
		}

		const data = await response.json();
		const keyCount = parseJwksKeys(data);

		if (keyCount == null) {
			return { ok: false, error: "Response is not a valid JWKS document" };
		}

		return { ok: true, keyCount };
	} catch (err) {
		return {
			ok: false,
			error: oauthErrorMessage(err, "JWKS validation failed"),
		};
	}
}

/** Validate JWKS from an OIDC discovery `jwks_uri` when present. */
export async function validateOidcJwksUri(
	jwksUri: string | undefined,
	signal?: AbortSignal,
): Promise<JwksValidationResult | null> {
	if (!jwksUri?.trim()) {
		return null;
	}

	return validateJwksUrl(jwksUri, signal);
}
