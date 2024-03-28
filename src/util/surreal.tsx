import { mapKeys, snake } from 'radash';
import { open_connection, close_connection, query_version, execute_query, watch_live_query, cancel_live_query } from '../generated/surrealist-embed';
import { SurrealOptions } from '~/types';
import { connectionUri, newId } from './helpers';
import { useInterfaceStore } from '~/stores/interface';

const MINIMUM_VERSION = import.meta.env.SDB_VERSION;

export interface QueryResponse {
	execution_time: string;
	success: boolean;
	result: any;
}

export interface SurrealConnection {
	close(): void;
	query(query: string, params?: Record<string, any>, id?: string): Promise<QueryResponse[]>;
	queryFirst(query: string): Promise<QueryResponse[]>;
	querySingle<T = any>(query: string): Promise<T>;
	cancelQueries(id: string): void;
}

let instance: SurrealConnection | undefined;

// Execute a query and parse the result
async function executeQuery(id: string | undefined, query: string, params: any) {
	const paramJson = JSON.stringify(params || {});
	const responses = (await execute_query(id, query, paramJson) || []) as QueryResponse[];

	return responses.map(res => {
		return {
			...res,
			result: JSON.parse(res.result)
		};
	});
}

/**
 * Access the active surreal instance
 */
export function getSurreal(): SurrealConnection | undefined {
	return instance;
}

/**
 * Forcefully access the active surreal instance
 */
export function getActiveSurreal(): SurrealConnection {
	if (!instance) {
		throw new Error("No active surreal instance");
	}

	return instance;
}

/**
 * Instantiate a connection to SurrealDB through the WASM module
 */
export function openSurrealConnection(options: SurrealOptions): SurrealConnection {
	if (instance) {
		return instance!;
	}

	let killed = false;

	const connection: any = mapKeys(options.connection, key => snake(key));
	const details = {
		...connection,
		endpoint: connectionUri(connection).replace(/^ws/, "http")
	};

	open_connection(details).then(async () => {
		const semver = await query_version();
		const version = `${semver.major}.${semver.minor}.${semver.patch}`;

		options.onConnect?.(version);
	}).catch(err => {
		console.error('Failed to open connection', err);

		if (!killed) {
			options.onError?.(err);
			options.onDisconnect?.(1000, 'Failed to open connection');
			killed = true;
		}
	});

	const handle: SurrealConnection = {
		close: () => {
			close_connection();
			options.onDisconnect?.(1000, 'Closed by user');
			killed = true;
		},
		query: async (query, params, id) => {
			const result = await executeQuery(id, query, params);

			if (id) {
				const { setIsLive, pushLiveQueryMessage, clearLiveQueryMessages } = useInterfaceStore.getState();

				setIsLive(id, true);

				watch_live_query(id, ({ queryId, action, data }: any) => {
					pushLiveQueryMessage(id, {
						id: newId(),
						action,
						queryId,
						data: JSON.parse(data),
						timestamp: Date.now()
					});
				}).then(() => {
					clearLiveQueryMessages(id);
					setIsLive(id, false);
				});
			}

			return result;
		},
		queryFirst: async (query) => {
			const results = await executeQuery(undefined, query, {});

			return results.map(res => {
				return {
					...res,
					result: Array.isArray(res.result) ? res.result[0] : res.result
				};
			});
		},
		querySingle: async (query) => {
			const results = await executeQuery(undefined, query, {});
			const { success, result } = results[0];

			if (success) {
				return Array.isArray(result) ? result[0] : result;
			} else {
				return null;
			}
		},
		cancelQueries(id) {
			cancel_live_query(id);
		},
	};

	instance = handle;

	return handle;
}

/**
 * Close the active surreal connection
 */
export function closeSurrealConnection() {
	if (!instance) {
		return;
	}

	instance.close();
	instance = undefined;
}