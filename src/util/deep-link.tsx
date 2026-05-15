import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import type { Connection } from "~/types";
import { connectionUri } from "~/util/helpers";

/**
 * Normalise a URL so it can be matched against `connectionUri(...)` outputs
 * regardless of trailing slashes, missing `/rpc` paths, or casing differences
 * that callers don't actually care about. Sandbox endpoints (`mem://`) are
 * collapsed to a single canonical form so the resolver can map them to the
 * built-in sandbox connection.
 */
function normalizeEndpointForMatch(url: string): string {
	const trimmed = url.trim();
	const lower = trimmed.toLowerCase();

	if (lower === "mem://" || lower === "mem:" || lower.startsWith("mem://")) {
		return "mem://";
	}

	try {
		const parsed = new URL(trimmed);
		let pathname = parsed.pathname;

		if (pathname.endsWith("/")) {
			pathname = pathname.slice(0, -1);
		}

		if (!pathname.toLowerCase().endsWith("/rpc")) {
			pathname = `${pathname}/rpc`;
		}

		return `${parsed.protocol}//${parsed.host}${pathname}`.toLowerCase();
	} catch {
		return lower;
	}
}

function endpointsMatch(a: string, b: string): boolean {
	return normalizeEndpointForMatch(a) === normalizeEndpointForMatch(b);
}

function effectiveNamespace(connection: Connection): string {
	const fromAuth = connection.authentication.namespace?.trim() ?? "";

	if (fromAuth) {
		return fromAuth;
	}

	return (connection.lastNamespace ?? "").trim();
}

function effectiveDatabase(connection: Connection): string {
	const fromAuth = connection.authentication.database?.trim() ?? "";

	if (fromAuth) {
		return fromAuth;
	}

	return (connection.lastDatabase ?? "").trim();
}

/**
 * Map IDE/tooling deep-link query params (`endpoint`, `ns`, `db`, `user`) to a
 * saved Surrealist connection id so callers can navigate away from whatever
 * connection is currently open.
 *
 * Returns `null` when no saved connection matches; callers should fall back
 * to the currently active connection so we don't silently spam the user's
 * connection list with throwaway entries.
 */
export function resolveDeepLinkConnectionId(
	endpoint: string,
	nsParam: string | null,
	dbParam: string | null,
	userParam: string | null,
): string | null {
	const { connections, sandbox } = useConfigStore.getState();

	if (normalizeEndpointForMatch(endpoint) === "mem://") {
		return SANDBOX;
	}

	const candidates = [sandbox, ...connections];

	for (const candidate of candidates) {
		if (!candidate) {
			continue;
		}

		// Cloud connections authenticate via a session token Surrealist
		// refreshes itself; the deep-link query string can't carry that
		// state, so we don't try to match them here. JetBrains hides cloud
		// connections from its dropdown for the same reason.
		if (candidate.authentication.mode === "cloud") {
			continue;
		}

		const uri = connectionUri(
			candidate.authentication.protocol,
			candidate.authentication.hostname,
		);

		if (!uri) {
			continue;
		}

		if (!endpointsMatch(uri, endpoint)) {
			continue;
		}

		const effNs = effectiveNamespace(candidate);
		const effDb = effectiveDatabase(candidate);
		const effUser = (candidate.authentication.username ?? "").trim();

		if (nsParam != null && nsParam !== "" && nsParam.trim() !== effNs) {
			continue;
		}

		if (dbParam != null && dbParam !== "" && dbParam.trim() !== effDb) {
			continue;
		}

		if (userParam != null && userParam !== "" && userParam.trim() !== effUser) {
			continue;
		}

		return candidate.id;
	}

	return null;
}

/**
 * Convenience wrapper that parses a deep-link query string and resolves it to
 * a Surrealist connection id, or `null` when the string has no `endpoint=`
 * field (in which case there's nothing for us to match against).
 */
export function resolveDeepLinkConnectionFromParams(params: string): string | null {
	if (!params) {
		return null;
	}

	const search = new URLSearchParams(params);
	const endpoint = search.get("endpoint");

	if (!endpoint) {
		return null;
	}

	return resolveDeepLinkConnectionId(
		endpoint,
		search.get("ns"),
		search.get("db"),
		search.get("user"),
	);
}
