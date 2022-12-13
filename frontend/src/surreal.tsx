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
	onConnect: () => void;
	onDisconnect: () => void;
}

export interface SurrealHandle {
	close(): void;
	query(query: string): Promise<any>;
}

export function createSurreal(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const socket = new WebSocket(endpoint.toString());
	const requestMap = new Map<string, (data: any) => void>();

	let isClosed = false;

	const message = (method: string, params: string[] = []) => {
		const id = uid(7);

		return new Promise((success, reject) => {
			requestMap.set(id, success);

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
		})
	}

	const pinger = setInterval(() => {
		message('ping');
	}, 30_000);

	socket.addEventListener('open', () => {
		const { namespace, database } = options.connection;

		options.onConnect();

		if (namespace && database) {
			message('use', [namespace, database]);
		}
	});

	socket.addEventListener('close', () => {
		if (!isClosed) {
			options.onDisconnect();
			clearInterval(pinger);
		}
	});

	socket.addEventListener('message', (event) => {
		const { id, result, method } = JSON.parse(event.data);

		if (method === 'notify') {
			return;
		}
		
		const cb = requestMap.get(id);

		if (!cb) {
			console.warn('No callback for message', event.data);
		} else {
			requestMap.delete(id);
			cb(result);
		}
	});

	function close() {
		isClosed = true;
		clearInterval(pinger);
		options.onDisconnect();
		socket.close();
	}

	async function query(query: string) {
		return message('query', [query]);
	}

	return {
		close,
		query,
	}
}