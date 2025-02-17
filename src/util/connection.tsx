import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import type { AuthLevel, Authentication } from "~/types";
import { connectionUri, fastParseJwt } from "./helpers";

/**
 * Returns the currently active connection
 *
 * FIXME: Completely repulsive hack, please lord forgive me for I have sinned
 */
export function getActiveConnection() {
	const parts = location.pathname.split("/");

	parts.shift();

	if (parts[0] === "c") {
		return parts[1];
	}

	return null;
}

/**
 * Returns the currently active connection
 */
export function getConnection() {
	const { connections, sandbox } = useConfigStore.getState();
	const activeConnection = getActiveConnection();

	if (activeConnection === SANDBOX) {
		return sandbox;
	}

	return connections.find((con) => con.id === activeConnection);
}

/**
 * Returns a connection by its ID
 */
export function getConnectionById(connection: string) {
	const { connections, sandbox } = useConfigStore.getState();

	if (connection === SANDBOX) {
		return sandbox;
	}

	return connections.find((con) => con.id === connection);
}

/**
 * Returns the active query tab
 */
export function getActiveQuery() {
	const connection = getConnection();

	return connection?.queries.find((q) => q.id === connection.activeQuery);
}

/**
 * Returns the authentication level of the given mode
 */
export function getAuthLevel(auth: Authentication): AuthLevel {
	if (auth.mode === "cloud") {
		return "root";
	}

	if (getAuthDB(auth)) {
		return "database";
	}

	if (getAuthNS(auth)) {
		return "namespace";
	}

	return "root";
}

/**
 * Extract the database from the given authentication
 */
export function getAuthDB(auth: Authentication) {
	if (auth.mode === "token") {
		const payload = fastParseJwt(auth.token);

		if (!payload || !payload.DB) {
			return null;
		}

		return payload.DB;
	}

	if (
		auth.mode === "database" ||
		auth.mode === "scope" ||
		auth.mode === "scope-signup" ||
		auth.mode === "access" ||
		auth.mode === "access-signup"
	) {
		return auth.database;
	}

	return null;
}

/**
 * Extract the namespace from the given authentication
 */
export function getAuthNS(auth: Authentication) {
	if (auth.mode === "token") {
		const payload = fastParseJwt(auth.token);

		if (!payload || !payload.NS) {
			return null;
		}

		return payload.NS;
	}

	if (auth.mode === "namespace" || getAuthDB(auth)) {
		return auth.namespace;
	}

	return null;
}

/**
 * Returns whether the given connection is valid
 *
 * TODO Replace with validation
 */
export function isConnectionValid(auth: Authentication | undefined) {
	if (!auth) {
		return false;
	}

	try {
		connectionUri(auth);
	} catch {
		return false;
	}

	// Check for essential fields
	const hasEssential = auth.protocol && auth.mode;

	if (!hasEssential) {
		return false;
	}

	// Check for hostname
	if (auth.protocol !== "mem" && auth.protocol !== "indxdb" && !auth.hostname) {
		return false;
	}

	// Check for username and password
	const checkUserPass =
		auth.mode === "root" || auth.mode === "database" || auth.mode === "namespace";
	const hasUserPass = auth.username && auth.password;

	if (checkUserPass && !hasUserPass) {
		return false;
	}

	// Check for namespace
	if (auth.mode === "namespace" && !auth.namespace) {
		return false;
	}

	// Check for database
	if (auth.mode === "database" && (!auth.namespace || !auth.database)) {
		return false;
	}

	// Check for token
	if (auth.mode === "token" && !auth.token) {
		return false;
	}

	// Check for access
	if (auth.mode === "access" && !auth.access) {
		return false;
	}

	return true;
}
