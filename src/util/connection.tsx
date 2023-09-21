import { mapKeys, snake } from 'radash';
import { open_connection, close_connection, execute_query } from '../generated/surrealist-embed';
import { SurrealOptions } from '~/types';
import { actions, store } from '~/store';

export interface SurrealConnection {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
	querySingle(query: string): Promise<any>;
}

let instance: SurrealConnection | undefined;
let connecting = false;

// Construct a fake error result
function createError(message: string) {
	return [{ time: '', status: 'ERR', result: 'Surrealist: ' + message }];
}

// Execute a query and parse the result
async function executeQuery(query: string, params: any) {
	const response = await execute_query(query, params || {});

	return JSON.parse(response);
}

// Schedule a query timeout error
async function scheduleTimeout(seconds: number) {
	return new Promise(res =>
		setTimeout(() => res(createError(`query timed out after ${seconds} seconds. You can increase this timeout in the Surrealist settings`)), seconds * 1000)
	);
}

async function execute(query: string, params: any) {
	console.log('Executing:', query, params);

	const { queryTimeout } = store.getState().config;

	store.dispatch(actions.setQueryActive(true));

	try {
		const result = await Promise.race([
			executeQuery(query, params),
			scheduleTimeout(queryTimeout)
		]);

		console.log('Query result:', result);

		return result;
	} catch(err: any) {
		console.error('Query failed:', err);

		return createError('an unknown error has occurred, please check the console for more details');
	} finally {
		store.dispatch(actions.setQueryActive(false));
	}
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
	if (connecting) {
		return instance!;
	}

	connecting = true;

	const connection: any = mapKeys(options.connection, key => snake(key));
	const details = {
		...connection,
		endpoint: connection.endpoint.replace(/^ws/, "http")
	};

	open_connection(details).then(() => {
		options.onConnect?.();
	}).catch(err => {
		console.error('Failed to open connection', err);
		options.onError?.(err);
		options.onDisconnect?.(1000, 'Failed to open connection');
	}).finally(() => {
		connecting = false;
	});

	const handle: SurrealConnection = {
		close: () => {
			close_connection();
			options.onDisconnect?.(1000, 'Closed by user');
		},
		query: async (query, params) => {
			return execute(query, params);
		},
		querySingle: async (query) => {
			const results = await execute(query, {}) as any[];

			return results.map(res => {
				return {
					...res,
					result: Array.isArray(res.result) ? res.result[0] : res.result
				};
			});
		},
	};

	instance = handle;

	return handle;
}