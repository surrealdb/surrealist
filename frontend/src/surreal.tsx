import { uid } from "radash";

export interface SurrealConnection {
	endpoint: string;
	username: string;
	password: string;
	namespace: string;
	database: string;
}

export interface SurrealOptions {
	connection: SurrealConnection;
	onConnect?: () => void;
	onDisconnect?: () => void;
	onError?: (code: number, reason: string) => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
}

type Request = [(data: any) => void, (error: any) => void];

export function createSurreal(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const socket = new WebSocket(endpoint.toString());
	const requestMap = new Map<string, Request>();
	const pinger = setInterval(() => { message('ping'); }, 30_000);

	let isClosed = false;

	/**
	 * Send a message to the database
	 */
	const message = (method: string, params: any[] = []) => {
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
			}, 10_000);
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
	});

	socket.addEventListener('close', (event) => {
		if (!isClosed) {
			cleanUp();
		}

		if (event.code !== 1000) {
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