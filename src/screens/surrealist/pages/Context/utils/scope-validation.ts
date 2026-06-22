/**
 * Shared validation for Spectron scope paths, used by the Scopes view and the
 * document upload form so both agree on what a well-formed scope path is.
 */

/** A single slash-separated segment: lowercase, no spaces, starts alphanumeric. */
export const SCOPE_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Validates a slash-separated scope path: lowercase segments, no spaces, no
 * `=` or `*`, and no empty segments. Returns an error string, or `null` when
 * the path is acceptable.
 */
export function validateScopePath(raw: string): string | null {
	const value = raw.trim();
	if (!value) {
		return "Enter a scope path";
	}
	if (/\s/.test(value)) {
		return "Paths cannot contain spaces";
	}
	if (value.includes("=") || value.includes("*")) {
		return "Paths cannot contain '=' or '*'";
	}

	const segments = value.replace(/\/+$/, "").split("/");
	if (segments.some((s) => s.length === 0)) {
		return "Paths cannot contain empty segments";
	}
	if (!segments.every((s) => SCOPE_SEGMENT.test(s))) {
		return "Use lowercase segments like org/apple/product";
	}
	return null;
}

/** Strips the canonical trailing slash from a registered scope path. */
export function normalizeScopePath(path: string): string {
	return path.replace(/\/+$/, "");
}
