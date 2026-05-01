export const JWT_REFRESH_BUFFER_SECONDS = 300;

/**
 * Returns the JWT `exp` claim as Unix seconds, or `null` if the payload has no expiry.
 * @throws If the token is not a three-segment JWT.
 */
export function getJwtExpiryUnixSeconds(token: string): number | null {
	const parts = token.split(".");

	if (parts.length !== 3) {
		throw new Error("Invalid JWT token");
	}

	const payload = JSON.parse(atob(parts[1])) as { exp?: number };
	const exp = payload.exp;

	if (exp === undefined || exp === null) {
		return null;
	}

	return exp;
}

/**
 * Whether the token should be refreshed: remaining lifetime is below `bufferSeconds`.
 */
export function shouldRefreshJwtBeforeExpiry(
	token: string,
	bufferSeconds: number = JWT_REFRESH_BUFFER_SECONDS,
	nowSeconds: number = Date.now() / 1000,
): boolean {
	const expiry = getJwtExpiryUnixSeconds(token);

	if (expiry === null) {
		return false;
	}

	return expiry - nowSeconds < bufferSeconds;
}
