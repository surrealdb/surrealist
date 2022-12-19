import { uid } from "radash";
import { store } from "./store";

export interface SurrealConnection {
	endpoint: string;
	username: string;
	password: string;
	namespace: string;
	database: string;
}

export interface SurrealOptions {
	connection: SurrealConnection;
	silent?: boolean;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (code: number, reason: string) => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
}

type Request = [(data: any) => void, (error: any) => void];

function createSurreal(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const socket = new WebSocket(endpoint.toString());
	const requestMap = new Map<string, Request>();
	const pinger = setInterval(() => { message('ping'); }, 30_000);

	let isClosed = false;
	let isSuccess = false;

	/**
	 * Send a message to the database
	 */
	const message = (method: string, params: any[] = []) => {
		const timeout = store.getState().queryTimeout * 1000;
		const id = uid(7);

		return new Promise((success, reject) => {
			requestMap.set(id, [success, reject]);

			socket.send(JSON.stringify({
				id,
				method,
				params
			}));

			setTimeout(() => {
				if (requestMap.delete(id)) {
					reject(new Error('Request timed out'));
				}
			}, timeout);
		});
	}

	/**
	 * Clean up any resources
	 */
	const cleanUp = () => {
		clearInterval(pinger);
		options.onDisconnect?.();
	}

	/**
	 * Forcefully close the connection
	 */
	const close = () => {
		isClosed = true;
		socket.close();
		cleanUp();
	};

	/**
	 * Send a general query to the database
	 */
	const query = async (query: string, params: Record<string, any>) => {
		return message('query', params ? [query, params] : [query]);
	};

	socket.addEventListener('open', async () => {
		const { username, password, namespace, database } = options.connection;

		options.onConnect?.();
 
		try {
			await message('signin', [{
				user: username,
				pass: password,
				// NS: namespace,
				// DB: database
			}]);
		} catch {
			close();
			return;
		}

		if (namespace && database) {
			message('use', [namespace, database]);
		}

		isSuccess = true;
	});

	socket.addEventListener('close', (event) => {
		if (!isClosed) {
			cleanUp();
		}

		const sendError = !options.silent || isSuccess;

		if (event.code !== 1000 && sendError) {
			options.onError?.(event.code, event.reason);
		}
	});

	socket.addEventListener('message', (event) => {
		const { id, result, method, error } = JSON.parse(event.data);

		if (method === 'notify') {
			return;
		}
		
		if (!requestMap.has(id)) {
			console.warn('No callback for message', event.data);
		} else {
			const [resolve, reject] = requestMap.get(id)!;

			requestMap.delete(id);

			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		}
	});

	return {
		close,
		query,
	}
}

let instance: SurrealHandle | null = null;

/**
 * Open a connection to the given database
 */
export function openSurreal(options: SurrealOptions) {
	instance?.close();
	instance = createSurreal(options);
}

/**
 * Retrieve the current database connection
 */
export function getSurreal(): SurrealHandle | null {
	return instance;
}
