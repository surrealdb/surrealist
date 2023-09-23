import { showNotification } from "@mantine/notifications";
import { actions, store } from "./store";
import { closeSurrealConnection, getSurreal, openSurrealConnection } from "./util/connection";
import { showError, updateConfig } from "./util/helpers";
import { fetchDatabaseSchema } from "./util/schema";
import { Text } from "@mantine/core";
import { getActiveEnvironment, getActiveTab, isConnectionValid, mergeConnections } from "./util/environments";
import { uid } from "radash";

/**
 * Open a new connection to the database
 * 
 * @param details Connection details
 * @param isSilent Whether to hide error notifications
 */
export function openConnection(isSilent?: boolean) {
	const { isConnecting, isConnected } = store.getState();

	const tabInfo = getActiveTab();
	const envInfo = getActiveEnvironment();

	const connection = mergeConnections(tabInfo?.connection || {}, envInfo?.connection || {});
	const connectionValid = isConnectionValid(connection);

	if (!connectionValid) {
		showNotification({
			color: "red.4",
			bg: "red.6",
			message: (
				<div>
					<Text color="white" weight={600}>
						Invalid Connection
					</Text>
					<Text color="white" opacity={0.8} size="sm">
						Please check your connection details
					</Text>
				</div>
			),
		});

		return;
	}

	closeConnection();

	try {
		store.dispatch(actions.setIsConnecting(true));
		store.dispatch(actions.setIsConnected(false));

		openSurrealConnection({
			connection,
			onConnect() {
				store.dispatch(actions.setIsConnecting(false));
				store.dispatch(actions.setIsConnected(true));

				fetchDatabaseSchema();
			},
			onDisconnect(code, reason) {
				store.dispatch(actions.setIsConnecting(false));
				store.dispatch(actions.setIsConnected(false));

				if (code != 1000 && !isSilent) {
					const subtitle = code === 1006 ? "Unexpected connection close" : reason || `Unknown reason`;

					showNotification({
						color: "red.4",
						bg: "red.6",
						message: (
							<div>
								<Text color="white" weight={600}>
									Connection Closed
								</Text>
								<Text color="white" opacity={0.8} size="sm">
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
	const tabInfo = getActiveTab();

	const { isConnected } = store.getState();
	
	if (!isConnected || !tabInfo) {
		showNotification({
			message: "You must be connected to send a query",
		});
		return;
	}

	const { id: tabId, query, name, variables } = tabInfo;

	const queryStr = options?.override?.trim() || query;
	const variableJson = variables
		? JSON.parse(variables)
		: undefined;

	try {
		if (options?.loader) {
			store.dispatch(actions.setQueryActive(true));
		}

		const response = await getSurreal()?.query(queryStr, variableJson);

		store.dispatch(
			actions.updateTab({
				id: tabId,
				lastResponse: response,
			})
		);
	} catch (err: any) {
		store.dispatch(
			actions.updateTab({
				id: tabId,
				lastResponse: [
					{
						status: "ERR",
						detail: err.message,
					},
				],
			})
		);
	} finally {
		if (options?.loader) {
			store.dispatch(actions.setQueryActive(false));
		}
	}

	store.dispatch(
		actions.addHistoryEntry({
			id: uid(5),
			query: query,
			tabName: name,
			timestamp: Date.now(),
		})
	);

	await updateConfig();
}

/**
 * Terminate the active connection
 */
export function closeConnection() {
	closeSurrealConnection();
	
	store.dispatch(actions.setIsConnecting(false));
	store.dispatch(actions.setIsConnected(false));
}