import { store } from "~/store";
import { ConnectionOptions } from "~/types";

/**
 * Returns the currently active tab
 */
export function getActiveSession() {
	const { activeTab, tabs } = store.getState().config;

	return tabs.find((tab) => tab.id === activeTab);
}

/**
 * Returns the currently active environment
 */
export function getActiveEnvironment() {
	const { environments } = store.getState().config;
	const activeSession = getActiveSession();

	return environments.find((e) => e.id === activeSession?.environment);
}

/**
 * Create an empty connection
 */
export function createEmptyConnection(): ConnectionOptions {
	return {
		endpoint: "",
		namespace: "",
		database: "",
		username: "",
		password: "",
		authMode: "root",
		scope: "",
		scopeFields: [],
	};
}

/**
 * Merge two connections together
 */
export function mergeConnections(
	left: Partial<ConnectionOptions>,
	right: Partial<ConnectionOptions>
): ConnectionOptions {
	const leftFields = left.scopeFields || [];
	const rightFields = right.scopeFields || [];

	return {
		namespace: left.namespace || right.namespace || "",
		database: left.database || right.database || "",
		endpoint: left.endpoint || right.endpoint || "",
		username: left.username || right.username || "",
		password: left.password || right.password || "",
		authMode: left.authMode || right.authMode || ("" as any),
		scope: left.scope || right.scope || "",
		scopeFields: [...leftFields, ...rightFields],
	};
}

/**
 * Returns whether the given connection is valid
 */
export function isConnectionValid(details: ConnectionOptions | undefined) {
	if (!details) {
		return false;
	}

	// Check for essential fields
	const hasEssential = details.endpoint && details.namespace && details.database && details.authMode;

	if (!hasEssential) {
		return false;
	}

	// Check for username and password
	const checkUserPass = details.authMode === "root" || details.authMode === "database" || details.authMode === "namespace";
	const hasUserPass = details.username && details.password;

	if (checkUserPass && !hasUserPass) {
		return false;
	}

	return true;
}
