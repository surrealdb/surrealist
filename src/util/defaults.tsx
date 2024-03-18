import { Connection, ConnectionOptions, QueryType, SurrealistConfig, SurrealistSettings, TabQuery } from "~/types";
import { newId } from "./helpers";
import { extract_query_type } from "~/generated/surrealist-embed";

export const CONFIG_VERSION = 1;

export function createBaseConfig(): SurrealistConfig {
	const settings = createBaseSettings();

	return {
		configVersion: CONFIG_VERSION,
		connections: [],
		sandbox: createSandboxConnection(settings),
		activeView: 'query',
		activeConnection: null,
		savedQueries: [],
		lastPromptedVersion: null,
		featureFlags: {},
		commandHistory: [],
		settings
	};
}

export function createBaseSettings(): SurrealistSettings {
	return {
		behavior: {
			updateChecker: true,
			tableSuggest: true,
			variableSuggest: true,
			queryErrorChecker: true,
			windowPinned: false,
			autoConnect: true,
			docsLanguage: "cli"
		},
		appearance: {
			colorScheme: "dark",
			windowScale: 100,
			editorScale: 100,
			resultWordWrap: true,
			defaultResultMode: "combined",
			defaultDiagramMode: "fields",
			defaultDiagramDirection: "ltr",
			expandSidebar: true
		},
		templates: {
			list: []
		},
		serving: {
			driver: "memory",
			storage: "",
			executable: "",
			username: "root",
			password: "root",
			port: 8000
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
		token: "",
		scope: "",
		scopeFields: []
	};
}

export function createBaseConnection(settings: SurrealistSettings): Connection {
	const baseTab = createBaseTab(settings);

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
		queryHistory: [],
		diagramMode: settings.appearance.defaultDiagramMode,
		diagramDirection: settings.appearance.defaultDiagramDirection,
	};
}

export function createBaseTab(settings: SurrealistSettings, query?: string, ): TabQuery {
	return {
		id: newId(),
		query: query || "",
		name: "",
		variables: "{}",
		response: [],
		queryType: query ? extract_query_type(query) as QueryType : "invalid",
		resultMode: settings.appearance.defaultResultMode,
	};

}

export function createSandboxConnection(settings: SurrealistSettings): Connection {
	return {
		...createBaseConnection(settings),
		id: "sandbox",
		name: "Sandbox",
		connection: {
			protocol: "mem",
			hostname: "",
			namespace: "sandbox",
			database: "sandbox",
			authMode: "none",
			token: "",
			scope: "",
			scopeFields: [],
			password: "",
			username: ""
		}
	};
}