import posthog from "posthog-js";
import compare from 'semver-compare';
import { closeSurrealConnection, getSurreal, openSurrealConnection } from "./util/surreal";
import { newId, showError } from "./util/helpers";
import { syncDatabaseSchema } from "./util/schema";
import { getConnection } from "./util/connection";
import { useDatabaseStore } from "./stores/database";
import { useConfigStore } from "./stores/config";
import { ConnectedEvent, DisconnectedEvent } from "./util/global-events";
import { useInterfaceStore } from "./stores/interface";
import { ConnectionOptions } from "./types";
import { showNotification } from '@mantine/notifications';
import { Stack, Text } from '@mantine/core';
import { Icon } from '~/components/Icon';
import { iconWarning } from './util/icons';

const MINIMUM_VERSION = import.meta.env.SDB_VERSION;

export interface ConnectOptions {
	connection?: ConnectionOptions;
}

/**
 * Open a new connection to the data
 * @param options Whether to hide error notifications
 * @param callback Callback to run after the connection is opened
 */
export function openConnection(options?: ConnectOptions): Promise<void> {
	const currentConnection = getConnection();
	const connection = options?.connection || currentConnection?.connection;

	if (!connection) {
		return Promise.reject(new Error("No connection available"));
	}

	const { setIsConnected, setIsConnecting, setVersion } = useDatabaseStore.getState();
	const { openScopeSignup } = useInterfaceStore.getState();

	closeConnection();

	return new Promise((resolve, reject) => {
		setIsConnecting(true);
		setIsConnected(false);

		posthog.capture('connection_open', {
			protocol: connection.protocol
		});

		openSurrealConnection({
			connection,
			onConnect(version) {
				setIsConnecting(false);
				setIsConnected(true);
				setVersion(version);
				syncDatabaseSchema();
				resolve();

				ConnectedEvent.dispatch(null);

				if (version.length > 0 && compare(version, MINIMUM_VERSION) < 0) {
					showNotification({
						autoClose: false,
						color: 'orange.6',
						message: (
							<Stack gap={0}>
								<Text fw={600}>
									<Icon
										path={iconWarning}
										size="sm"
										left
										mt={-2}
									/>
									Unsupported database version
								</Text>
								<Text c="slate">
									The remote database is using an older version of SurrealDB ({version}) while this version of Surrealist recommends at least {MINIMUM_VERSION}
								</Text>
							</Stack>
						)
					});
				}
			},
			onDisconnect(code, reason) {
				setIsConnecting(false);
				setIsConnected(false);
				setVersion("");

				DisconnectedEvent.dispatch(null);

				if (code != 1000) {
					const subtitle = code === 1006
						? "Unexpected connection close"
						: reason || `Unknown reason`;

					showError({
						title: "Connection lost",
						subtitle: `${subtitle} (${code})`,
					});
				}
			},
			onError(error) {
				reject(new Error(error));

				if (error.includes("No record was returned")) {
					openScopeSignup();
				}
			},
		});
	});
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
		showError({
			title: "Failed to execute",
			subtitle: "You must be connected to the database"
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

		posthog.capture('query_execute');
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