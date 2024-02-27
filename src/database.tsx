import { showNotification } from "@mantine/notifications";
import { closeSurrealConnection, getSurreal, openSurrealConnection } from "./util/surreal";
import { newId, showError } from "./util/helpers";
import { fetchDatabaseSchema } from "./util/schema";
import { Text } from "@mantine/core";
import { getActiveConnection } from "./util/connection";
import { getConnection } from "./util/connection";
import { useDatabaseStore } from "./stores/database";
import { useConfigStore } from "./stores/config";

/**
 * Open a new connection to the data
 * @param isSilent Whether to hide error notifications
 * @param callback Callback to run after the connection is opened
 */
export function openConnection(isSilent?: boolean, callback?: (success: boolean) => void) {
	const { setIsConnected, setIsConnecting } = useDatabaseStore.getState();
	const connection = getActiveConnection();

	closeConnection();

	try {
		setIsConnecting(true);
		setIsConnected(false);

		openSurrealConnection({
			connection,
			onConnect() {
				setIsConnecting(false);
				setIsConnected(true);
				fetchDatabaseSchema();
				callback?.(true);
			},
			onDisconnect(code, reason) {
				setIsConnecting(false);
				setIsConnected(false);
				callback?.(false);

				if (code != 1000 && !isSilent) {
					const subtitle = code === 1006 ? "Unexpected connection close" : reason || `Unknown reason`;

					showNotification({
						color: "red.4",
						bg: "red.6",
						message: (
							<div>
								<Text c="white" w={600}>
									Connection Closed
								</Text>
								<Text c="white" opacity={0.8} size="sm">
									{subtitle} ({code})
								</Text>
							</div>
						),
					});
				}
			},
		});
	} catch (err: any) {
		showError("Failed to open connection", err.message);
	}
}

export interface QueryOptions {
	override?: string;
	loader?: boolean;
}

/**
 * Execute a query against the active connection
 *
 * @param options Query options
 */
export async function executeQuery(options?: QueryOptions) {
	const { setQueryActive, isConnected } = useDatabaseStore.getState();
	const { addHistoryEntry, updateQueryTab } = useConfigStore.getState();
	const connection = getConnection();

	if (!connection || !isConnected) {
		showNotification({
			message: "You must be connected to send a query",
		});
		return;
	}

	const tabQuery = connection.queries.find((q) => q.id === connection.activeQuery);

	if (!tabQuery) {
		return;
	}

	const { id, query, variables, name } = tabQuery;
	const queryStr = (options?.override || query).trim();
	const variableJson = variables
		? JSON.parse(variables)
		: undefined;

	if (query.length === 0) {
		return;
	}

	try {
		if (options?.loader) {
			setQueryActive(true);
		}

		const surreal = getSurreal();
		const response = await surreal?.query(queryStr, variableJson, id) || [];

		updateQueryTab({
			id,
			response
		});
	} finally {
		if (options?.loader) {
			setQueryActive(false);
		}
	}

	addHistoryEntry({
		id: newId(),
		query: queryStr,
		timestamp: Date.now(),
		origin: name
	});
}

/**
 * Terminate the active connection
 */
export function closeConnection() {
	const { setIsConnected, setIsConnecting } = useDatabaseStore.getState();

	closeSurrealConnection();
	setIsConnecting(false);
	setIsConnected(false);
}