import { showNotification } from "@mantine/notifications";
import { closeSurrealConnection, getSurreal, openSurrealConnection } from "./util/connection";
import { showError } from "./util/helpers";
import { fetchDatabaseSchema } from "./util/schema";
import { Text } from "@mantine/core";
import { getActiveEnvironment, getActiveSession, isConnectionValid, mergeConnections } from "./util/environments";
import { uid } from "radash";
import { useDatabaseStore } from "./stores/database";
import { useConfigStore } from "./stores/config";
import { ConnectionOptions } from "./types";

const SANDBOX_CONNECTION: ConnectionOptions = {
	method: "local",
	authMode: "none",
	namespace: "sandbox",
	database: "sandbox",
	endpoint: "mem://",
	username: "",
	password: "",
	scope: "",
	scopeFields: []
};

/**
 * Open a new connection to the database
 * 
 * @param details Connection details
 * @param isSilent Whether to hide error notifications
 */
export function openConnection(isSilent?: boolean) {
	const { setIsConnected, setIsConnecting } = useDatabaseStore.getState();

	const sessionInfo = getActiveSession();
	const envInfo = getActiveEnvironment();

	const connection = mergeConnections(sessionInfo?.connection || {}, envInfo?.connection || {});
	const connectionValid = isConnectionValid(connection);

	if (!connectionValid) {
		showNotification({
			color: "red.4",
			bg: "red.6",
			message: (
				<div>
					<Text c="white" w={600}>
						Invalid Connection
					</Text>
					<Text c="white" opacity={0.8} size="sm">
						Please check your connection details
					</Text>
				</div>
			),
		});

		return;
	}

	closeConnection();

	try {
		setIsConnecting(true);
		setIsConnected(false);

		const connectionInfo = connection.method === "local"
			? SANDBOX_CONNECTION
			: connection;

		openSurrealConnection({
			connection: connectionInfo,
			onConnect() {
				setIsConnecting(false);
				setIsConnected(true);

				fetchDatabaseSchema();
			},
			onDisconnect(code, reason) {
				setIsConnecting(false);
				setIsConnected(false);

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
	const { setQueryActive } = useDatabaseStore.getState();
	const { addHistoryEntry, updateSession } = useConfigStore.getState();
	const sessionInfo = getActiveSession();
	const isRemote = sessionInfo?.connection?.method === "remote";

	if (!sessionInfo || isRemote) {
		const { isConnected } = useDatabaseStore.getState();
		
		if (!isConnected || !sessionInfo) {
			showNotification({
				message: "You must be connected to send a query",
			});
			return;
		}
	}

	const { id: tabId, queries, activeQueryId, name, variables } = sessionInfo;

	const activeQuery = queries.find((q) => q.id === activeQueryId);
	const queryStr = options?.override?.trim() || activeQuery?.text || '';
	const variableJson = variables
		? JSON.parse(variables)
		: undefined;

	try {
		if (options?.loader) {
			setQueryActive(true);
		}

		const response = await getSurreal()?.query(queryStr, variableJson);

		updateSession({
			id: tabId,
			lastResponse: response,
		});
	} catch (err: any) {
		updateSession({
			id: tabId,
			lastResponse: [
				{
					status: "ERR",
					detail: err.message,
				},
			],
		});
	} finally {
		if (options?.loader) {
			setQueryActive(false);
		}
	}

	addHistoryEntry({
		id: uid(5),
		query: queryStr,
		tabName: name,
		timestamp: Date.now(),
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