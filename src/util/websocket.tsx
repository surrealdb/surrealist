import { uid } from "radash";
import { store } from "~/store";
import { SurrealHandle, SurrealOptions } from "~/typings";
import { printLog } from "./helpers";

type Request = [(data: any) => void, (error: any) => void];

export function createLocalWebSocket(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const socket = new WebSocket(endpoint.toString());
	const requestMap = new Map<string, Request>();
	const pinger = setInterval(() => { message('ping'); }, 30_000);

	let cleanedUp = false;

	/**
	 * Send a message to the database
	 */
	const message = (method: string, params: any[] = []) => {
		if (socket.readyState !== WebSocket.OPEN) {
			return Promise.reject(new Error('Connection is not open'));
		}

		const timeout = store.getState().config.queryTimeout * 1000;
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
	};

	/**
	 * Clean up any resources
	 */
	const cleanUp = (code: number, reason: string) => {
		if (cleanedUp) {
			return;
		}

		clearInterval(pinger);
		options.onDisconnect?.(code, reason);
		cleanedUp = true;
	};

	/**
	 * Forcefully close the connection
	 */
	const close = () => {
		if (socket.readyState == WebSocket.CLOSING || socket.readyState == WebSocket.CLOSED) {
			return;
		}

		socket.close(1000, 'Closed by user');
		cleanUp(1000, 'Closed by user');
	};

	/**
	 * Send a general query to the database
	 */
	const query = async (query: string, params: Record<string, any>) => {
		printLog('Query', '#ff1abe', query);

		return message('query', params ? [query, params] : [query]);
	};

	socket.addEventListener('open', async () => {
		const { username, password, namespace, database, authMode, scope, scopeFields } = options.connection;

		if (authMode !== 'none') {
			const details: any = {};
	
			if (authMode == 'namespace') {
				details.NS = namespace || '';
			}
	
			if (authMode == 'database') {
				details.NS = namespace || '';
				details.DB = database || '';
			}
	
			if (authMode == 'scope') {
				details.NS = namespace || '';
				details.DB = database || '';
				details.SC = scope || '';
				
				for (const field of scopeFields) {
					details[field.subject] = field.value;
				}
			} else {
				details.user = username;
				details.pass = password;
			}
			
			try {
				await message('signin', [details]);
			} catch {
				close();
				return;
			}
		}
		
		if (namespace && database) {
			await message('use', [namespace, database]);
		}
		
		options.onConnect?.();
	});

	socket.addEventListener('close', (event) => {
		if (event.code !== 1000) {
			cleanUp(event.code, event.reason);
		}
	});

	socket.addEventListener('message', (event) => {
		const { id, result, method, error } = JSON.parse(event.data);

		if (method === 'notify') {
			return;
		}
		
		if (requestMap.has(id)) {
			const [resolve, reject] = requestMap.get(id)!;

			requestMap.delete(id);

			if (error) {
				reject(error);
			} else {
				resolve(result);
			}
		} else {
			console.warn('No callback for message', event.data);
		}
	});

	socket.addEventListener('error', (e: any) => {
		options.onError?.(e.error);
	});

	return {
		close,
		query,
	};
}