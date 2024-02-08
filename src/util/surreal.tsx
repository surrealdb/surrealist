import { mapKeys, snake } from 'radash';
import { open_connection, close_connection, query_version, execute_query } from '../generated/surrealist-embed';
import { SurrealOptions } from '~/types';
import compare from 'semver-compare';
import { showNotification } from '@mantine/notifications';
import { Stack, Text } from '@mantine/core';
import { Icon } from '~/components/Icon';
import { mdiAlert } from '@mdi/js';
import { connectionUri } from './helpers';

const MINIMUM_VERSION = import.meta.env.SDB_VERSION;

export interface SurrealConnection {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
	queryFirst(query: string): Promise<any>;
	querySingle<T = any>(query: string): Promise<T>;
	queryLive(query: string, params?: Record<string, any>): Promise<any>;
}

let instance: SurrealConnection | undefined;

// Execute a query and parse the result
async function executeQuery(query: string, params: any) {
	const paramJson = JSON.stringify(params || {});
	const response = await execute_query(query, paramJson);

	return JSON.parse(response);
}

// Display a notification if the database version is unsupported
async function checkDatabaseVersion() {
	const semver = await query_version();

	let title: string;
	let message: string;

	if (semver == undefined) {
		title = 'Failed to retrieve database version';
		message = 'Failed to retrieve the remote database version. This may be caused by a network error or an older version of SurrealDB';
	} else {
		const version = `${semver.major}.${semver.minor}.${semver.patch}`;

		if (compare(version, MINIMUM_VERSION) >= 0) {
			return;
		}

		title = 'Unsupported database version';
		message = `The remote database is using an older version of SurrealDB (${version}) while this version of Surrealist recommends at least ${MINIMUM_VERSION}`;
	}

	showNotification({
		autoClose: false,
		color: 'orange',
		message: (
			<Stack gap={0}>
				<Text fw={600}>
					<Icon
						path={mdiAlert}
						size="sm"
						left
						mt={-2}
					/>
					{title}
				</Text>
				<Text c="light.5">
					{message}
				</Text>
			</Stack>
		)
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

	const connection: any = mapKeys(options.connection.connection, key => snake(key));
	const details = {
		...connection,
		endpoint: connectionUri(connection).replace(/^ws/, "http")
	};

	open_connection(details).then(() => {
		options.onConnect?.();
		checkDatabaseVersion();
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
		query: async (query, params) => {
			return executeQuery(query, params);
		},
		queryFirst: async (query) => {
			const results = await executeQuery(query, {}) as any[];

			return results.map(res => {
				return {
					...res,
					result: Array.isArray(res.result) ? res.result[0] : res.result
				};
			});
		},
		querySingle: async (query) => {
			const results = await executeQuery(query, {}) as any[];
			const { result, status } = results[0];

			if (status === 'OK') {
				return Array.isArray(result) ? result[0] : result;
			} else {
				return null;
			}
		},
		queryLive: async (query, params) => {
			// 
		}
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