import { CloudInstance, Connection, Authentication, DatabaseSchema, SurrealistConfig, SurrealistSettings, TabQuery } from "~/types";
import { newId } from "./helpers";
import { validateQuery } from "./surrealql";
import { SANDBOX } from "~/constants";

export const CONFIG_VERSION = 2;

export function createBaseConfig(): SurrealistConfig {
	const settings = createBaseSettings();

	return {
		configVersion: CONFIG_VERSION,
		previousVersion: import.meta.env.VERSION,
		connections: [],
		connectionGroups: [],
		sandbox: createSandboxConnection(settings),
		activeScreen: 'start',
		activeView: 'query',
		activeConnection: SANDBOX,
		activeCloudPage: 'instances',
		activeCloudOrg: '',
		savedQueries: [],
		lastPromptedVersion: null,
		featureFlags: {},
		commandHistory: [],
		lastViewedNewsAt: null,
		onboarding: [],
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
			docsLanguage: "cli",
			versionCheckTimeout: 5,
			reconnectInterval: 3,
		},
		appearance: {
			colorScheme: "dark",
			windowScale: 100,
			editorScale: 100,
			resultWordWrap: true,
			defaultResultMode: "combined",
			defaultDiagramMode: "fields",
			defaultDiagramDirection: "ltr",
			defaultDiagramShowLinks: false,
			lineStyle: "metro",
			sidebarMode: "expandable",
			valueMode: "sql",
			queryOrientation: "vertical"
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
		},
		cloud: {
			databaseListMode: "grid",
			urlAuthBase: "",
			urlApiBase: "",
			urlApiMgmtBase: "",
		}
	};
}

export function createBaseAuthentication(): Authentication {
	return {
		protocol: "ws",
		hostname: "",
		username: "",
		password: "",
		mode: "root",
		database: "",
		namespace: "",
		token: "",
		scope: "",
		scopeFields: [],
	};
}

export function createBaseConnection(settings: SurrealistSettings): Connection {
	const baseTab = createBaseTab(settings);

	return {
		id: newId(),
		name: "",
		icon: 0,
		queries: [{
			...baseTab,
			name: "New query"
		}],
		activeQuery: baseTab.id,
		authentication: createBaseAuthentication(),
		pinnedTables: [],
		queryHistory: [],
		lastNamespace: "",
		lastDatabase: "",
		designerTableList: true,
		diagramMode: settings.appearance.defaultDiagramMode,
		diagramDirection: settings.appearance.defaultDiagramDirection,
		diagramShowLinks: settings.appearance.defaultDiagramShowLinks,
		graphqlQuery: "",
		graphqlVariables: ""
	};
}

export function createBaseTab(settings: SurrealistSettings, query?: string, ): TabQuery {
	return {
		id: newId(),
		query: query || "",
		name: "",
		variables: "{}",
		valid: query ? !validateQuery(query) : true,
		resultMode: settings.appearance.defaultResultMode,
	};
}

export function createSandboxConnection(settings: SurrealistSettings): Connection {
	const base = createBaseConnection(settings);

	return {
		...base,
		id: "sandbox",
		name: "Sandbox",
		lastNamespace: "sandbox",
		lastDatabase: "sandbox",
		authentication: {
			...base.authentication,
			protocol: "mem",
			mode: "none"
		}
	};
}

export function createDatabaseSchema(): DatabaseSchema {
	return {
		kvUsers: [],
		nsUsers: [],
		dbUsers: [],
		scopes: [],
		functions: [],
		models: [],
		tables: [],
	};
}

export function createCloudInstance(): CloudInstance {
	return {
		id: "",
		host: "",
		name: "",
		region: "",
		version: "",
		state: "inactive",
		type: {
			slug: "",
			description: "",
			cpu: 0,
			memory: 0,
			storage: 0,
			compute_units: {}
		}
	};
}
