import {SurrealConnection} from "./surreal";

export interface SurrealistTab {
	id: string;
	name: string;
	query: string;
	variables: string;
	connection: SurrealConnection;
	lastResponse: any;
	layout: any;
}

export interface HistoryEntry {
	query: string;
	timestamp: number;
	tabName: string;
}

export interface ConsoleOutputMessage {
	kind: "stdout" | "stderr";
	message: string;
}
