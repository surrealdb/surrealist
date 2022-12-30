import { ColorScheme } from "@mantine/core";
import {SurrealConnection} from "./surreal";

export type DriverType = "file" | "memory" | "tikv";

export interface SurrealistConfig {
	theme: ColorScheme | 'automatic';
	tabs: SurrealistTab[];
	autoConnect: boolean;
	tableSuggest: boolean;
	wordWrap: boolean;
	history: any[];
	localDriver: DriverType;
	localStorage: string;
	enableConsole: boolean;
	enableHistory: boolean;
	queryTimeout: number;
	updateChecker: boolean;
}

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
