import { Connection, ConnectionOptions, SurrealistConfig, TabQuery } from "~/types";
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
	const baseTab = createBaseTab();

	return {
		id: newId(),
		name: "",
		queries: [{
			...baseTab,
			name: "Query 1"
		}],
		activeQuery: baseTab.id,
		connection: createBaseConnectionOptions(),
		pinnedTables: [],
		liveQueries: [],
		queryHistory: []
	};
}

export function createBaseTab(query?: string): TabQuery {
	return {
		id: newId(),
		query: query || "",
		name: "",
		variables: "{}",
		response: null
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