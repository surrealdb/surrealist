import type {
	Authentication,
	Connection,
	ConnectionSchema,
	QueryTab,
	QueryType,
	SurrealistConfig,
	SurrealistSettings,
} from "~/types";

import { HOSTNAME } from "./analytics";
import { newId } from "./helpers";

export const CONFIG_VERSION = 2;

export function createBaseConfig(): SurrealistConfig {
	const settings = createBaseSettings();

	return {
		configVersion: CONFIG_VERSION,
		previousVersion: import.meta.env.VERSION,
		connections: [],
		sandbox: createSandboxConnection(settings),
		activeResource: "/overview",
		savedQueries: [],
		lastPromptedVersion: null,
		featureFlags: {},
		commandHistory: [],
		lastViewedNewsAt: null,
		openDesignerPanels: ["general"],
		keybindings: {},
		onboarding: [],
		settings,
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
			queryQuickClose: true,
		},
		appearance: {
			colorScheme: "dark",
			syntaxTheme: "default",
			windowScale: 100,
			editorScale: 100,
			queryLineNumbers: true,
			inspectorLineNumbers: true,
			functionLineNumbers: true,
			resultWordWrap: true,
			defaultResultMode: "combined",
			defaultResultFormat: "sql",
			defaultDiagramAlgorithm: "aligned",
			defaultDiagramDirection: "ltr",
			defaultDiagramLineStyle: "metro",
			defaultDiagramLinkMode: "visible",
			defaultDiagramMode: "fields",
			sidebarMode: "expandable",
			queryOrientation: "vertical",
			sidebarViews: {},
		},
		templates: {
			list: [],
		},
		serving: {
			driver: "memory",
			logLevel: "info",
			storage: "",
			executable: "",
			username: "root",
			password: "root",
			port: 8000,
			historySize: 250,
		},
		cloud: {
			databaseListMode: "grid",
			urlAuthBase: "",
			urlApiBase: "",
			urlApiMgmtBase: "",
		},
		gtm: {
			origin: HOSTNAME,
			preview_header: "",
			debug_mode: false,
		},
	};
}

export function createBaseAuthentication(): Authentication {
	return {
		protocol: "wss",
		hostname: "",
		username: "",
		password: "",
		mode: "root",
		database: "",
		namespace: "",
		token: "",
		access: "",
		accessFields: [],
	};
}

export function createBaseConnection(settings: SurrealistSettings): Connection {
	const baseTab = createBaseQuery(settings, "config");

	return {
		id: newId(),
		name: "",
		icon: 0,
		queries: [
			{
				...baseTab,
				name: "New query",
			},
		],
		activeQuery: baseTab.id,
		authentication: createBaseAuthentication(),
		pinnedTables: [],
		queryHistory: [],
		lastNamespace: "",
		lastDatabase: "",
		designerTableList: true,
		explorerTableList: true,
		queryTabList: true,
		diagramAlgorithm: "default",
		diagramDirection: "default",
		diagramLineStyle: "default",
		diagramMode: "default",
		diagramLinkMode: "default",
		graphqlQuery: "",
		graphqlVariables: "{}",
		graphqlShowVariables: false,
	};
}

export function createBaseQuery(settings: SurrealistSettings, type: QueryType): QueryTab {
	return {
		id: newId(),
		type,
		query: "",
		name: "",
		variables: "{}",
		valid: true,
		resultMode: settings.appearance.defaultResultMode,
		resultFormat: settings.appearance.defaultResultFormat,
		showVariables: false,
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
			mode: "none",
		},
	};
}

export function createConnectionSchema(): ConnectionSchema {
	return {
		root: {
			namespaces: [],
			accesses: [],
			users: [],
		},
		namespace: {
			databases: [],
			accesses: [],
			users: [],
		},
		database: {
			tables: [],
			accesses: [],
			users: [],
			functions: [],
			models: [],
		},
	};
}
