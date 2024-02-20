import { Connection, ConnectionOptions, QueryType, SurrealistConfig, TabQuery } from "~/types";
import { newId } from "./helpers";
import { extract_query_type } from "~/generated/surrealist-embed";

export function createBaseConfig(): SurrealistConfig {
	return {
		colorScheme: "auto",
		connections: [],
		sandbox: createSandboxConnection(),
		activeView: 'query',
		isPinned: false,
		windowScale: 100,
		editorScale: 100,
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
		errorChecking: true,
		lastPromptedVersion: null,
		defaultDesignerNodeMode: 'summary'
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
			name: "New query"
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
		response: [],
		queryType: query ? extract_query_type(query) as QueryType : "invalid",
		resultMode: "combined"
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