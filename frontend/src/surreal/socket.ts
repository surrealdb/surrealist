export interface SocketDetails {
	endpoint: string;
	username: string;
	password: string;
	onSuccess: () => void;
	onFailure: (error: string) => void;
	executeQuery: (query: string) => string;
}

export function createSocket(details: SocketDetails) {

}