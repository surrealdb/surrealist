import { Connection, ConnectionOptions, QueryType, SurrealistConfig, TabQuery } from "~/types";
import { newId } from "./helpers";
import { extract_query_type } from "~/generated/surrealist-embed";

export const CONFIG_VERSION = 1;

export function createBaseConfig(): SurrealistConfig {
	return {
		configVersion: CONFIG_VERSION,
		connections: [],
		sandbox: createSandboxConnection(),
		activeView: 'query',
		activeConnection: null,
		savedQueries: [],
		lastPromptedVersion: null,
		settings: {
			behavior: {
				updateChecker: true,
				tableSuggest: true,
				variableSuggest: true,
				queryErrorChecker: true,
				windowPinned: false,
				autoConnect: true
			},
			appearance: {
				colorScheme: "auto",
				windowScale: 100,
				editorScale: 100,
				resultWordWrap: true,
				defaultResultMode: "combined",
				defaultDiagramMode: "fields",
				defaultDiagramDirection: "ltr"
			},
			templates: {
				list: undefined
			},
			serving: {
				driver: "memory",
				storage: "",
				executable: "",
				username: "root",
				password: "root",
				port: 8000
			}
		}
	};
}

export function createBaseConnectionOptions(): ConnectionOptions {
	return {
		protocol: "ws",
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

export function createBaseConnection(): Connection {
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
		queryHistory: []
	};
}

export function createBaseTab(query?: string, ): TabQuery {
	return {
		id: newId(),
		query: query || "",
		name: "",
		variables: "{}",
		response: [],
		queryType: query ? extract_query_type(query) as QueryType : "invalid",
		resultMode: "combined",
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