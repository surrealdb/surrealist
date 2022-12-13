import { uid } from "radash";

const id = () => uid(7);

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
}

export function createSurreal(options: SurrealOptions): SurrealHandle {
	const endpoint = new URL('rpc', options.connection.endpoint.replace('http', 'ws'));
	const socket = new WebSocket(endpoint.toString());

	const message = (id: string, method: string, params: string[] = []) => {
		socket.send(JSON.stringify({
			id,
			method,
			params
		}));
	}

	const pinger = setInterval(() => {
		message(id(), 'ping');
	}, 30_000);

	socket.addEventListener('open', () => {
		console.log('Connection opened');

		options.onConnect();
	});

	socket.addEventListener('close', () => {
		console.log('Connection closed');

		options.onDisconnect();
		clearInterval(pinger);
	});

	socket.addEventListener('error', () => {
		console.log('Connection error');
	});

	socket.addEventListener('message', (event) => {
		console.log('Message received', event.data);
	});

	return {
		close() {
			clearInterval(pinger);
			socket.close();
		}
	}
}