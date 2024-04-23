import { unique } from "radash";
import { useMemo } from "react";
import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";

/**
 * Returns whether Surrealist is connected to a database
 */
export function useIsConnected() {
	return useDatabaseStore((s) => s.isConnected);
}

/**
 * Return a list of all connections
 */
export function useConnections() {
	return useConfigStore((s) => s.connections);
}

/**
 * Returns the active connection, or undefined
 */
export function useConnection() {
	const activeId = useConfigStore((s) => s.activeConnection);
	const list = useConfigStore((s) => s.connections);
	const sandbox = useConfigStore((s) => s.sandbox);

	if (activeId === SANDBOX) {
		return sandbox;
	}

	return list.find((con) => con.id === activeId);
}

/**
 * Similar to useConnection except throws an error if the connection is not available
 *
 * This should only be used from views which are only available when a connection is active
 */
export function useActiveConnection() {
	const connection = useConnection();

	if (!connection) {
		throw new Error("Session unavailable");
	}

	return connection;
}

/**
 * Returns the active query tab
 *
 * @returns The active query tab
 */
export function useActiveQuery() {
	const connection = useActiveConnection();

	return connection.queries.find((q) => q.id === connection.activeQuery);
}

/**
 * Returns a list of all saved query tags
 */
export function useSavedQueryTags() {
	const queries = useConfigStore((s) => s.savedQueries);

	return useMemo(() => {
		return unique(queries.flatMap((q) => q.tags));
	}, [queries]);
}