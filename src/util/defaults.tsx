import { Connection, ConnectionOptions, SurrealistConfig } from "~/types";
import { newId } from "./helpers";

export function createBaseConfig(): SurrealistConfig {
	return {
		colorScheme: "auto",
		connections: [],
		sandbox: createSandboxConnection(),
		activeView: 'query',
		isPinned: false,
		activeConnection: null,
		autoConnect: true,
		tableSuggest: true,
		wordWrap: true,
		savedQueries: [],
		localSurrealDriver: "memory",
		localSurrealStorage: "",
		localSurrealPath: "",
		localSurrealUser: "root",
		localSurrealPass: "root",
		localSurrealPort: 8000,
		updateChecker: true,
		resultMode: "json",
		fontZoomLevel: 1,
		errorChecking: true,
		lastPromptedVersion: null,
		defaultDesignerNodeMode: 'fields',
		defaultDesignerLayoutMode: 'diagram'
	};
}

export function createBaseConnectionOptions(): ConnectionOptions {
	return {
		protocol: "wss",
		hostname: "",
		namespace: "",
		database: "",
		username: "",
		password: "",
		authMode: "root",
		scope: "",
		scopeFields: []
	};
}

export function createBaseConnection(query?: string): Connection {
	return {
		id: newId(),
		name: "",
		queries: [{ id: 1, text: query || '' }],
		activeQueryId: 1,
		lastQueryId: 1,
		variables: "{}",
		lastResponse: [],
		connection: createBaseConnectionOptions(),
		pinnedTables: [],
		liveQueries: [],
		queryHistory: []
	};
}

export function createSandboxConnection(): Connection {
	return {
		...createBaseConnection(),
		id: "sandbox",
		name: "Sandbox",
		connection: {
			protocol: "mem",
			hostname: "",
			namespace: "sandbox",
			database: "sandbox",
			authMode: "none",
			scope: "",
			scopeFields: [],
			password: "",
			username: ""
		}
	};
}