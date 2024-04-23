import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { ConnectionOptions } from "~/types";

/**
 * Returns the currently active connection
 */
export function getConnection() {
	const { connections, activeConnection, sandbox } = useConfigStore.getState();

	if (activeConnection === SANDBOX) {
		return sandbox;
	}

	return connections.find((con) => con.id === activeConnection);
}

/**
 * Returns the currently active connection
 */
export function getActiveConnection() {
	const connection = getConnection();

	if (!connection) {
		throw new Error("Session unavailable");
	}

	return connection;
}

/**
 * Returns the active query tab
 */
export function getActiveQuery() {
	const connection = getActiveConnection();

	return connection.queries.find((q) => q.id === connection.activeQuery);
}

/**
 * Returns whether the given connection is valid
 *
 * TODO Replace with validation
 */
export function isConnectionValid(details: ConnectionOptions | undefined) {
	if (!details) {
		return false;
	}

	// Check for essential fields
	const hasEssential = details.protocol && details.namespace && details.database && details.authMode;

	if (!hasEssential) {
		return false;
	}

	// Check for hostname
	if (details.protocol !== "mem" && details.protocol !== "indxdb" && !details.hostname) {
		return false;
	}

	// Check for username and password
	const checkUserPass = details.authMode === "root" || details.authMode === "database" || details.authMode === "namespace";
	const hasUserPass = details.username && details.password;

	if (checkUserPass && !hasUserPass) {
		return false;
	}

	// Check for token
	if (details.authMode === "token" && !details.token) {
		return false;
	}

	return true;
}

