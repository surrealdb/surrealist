import { SANDBOX } from "~/constants";
import type {
	Authentication,
	CloudInstance,
	Connection,
	ConnectionSchema,
	QueryTab,
	QueryType,
	SurrealistConfig,
	SurrealistSettings,
} from "~/types";
import { newId } from "./helpers";
import { validateQuery } from "./surrealql";

export const CONFIG_VERSION = 2;

export function createBaseConfig(): SurrealistConfig {
	const settings = createBaseSettings();

	return {
		configVersion: CONFIG_VERSION,
		previousVersion: import.meta.env.VERSION,
		connections: [],
		connectionGroups: [],
		sandbox: createSandboxConnection(settings),
		activeScreen: "start",
		activeView: "query",
		activeConnection: SANDBOX,
		activeCloudPage: "instances",
		activeCloudOrg: "",
		savedQueries: [],
		lastPromptedVersion: null,
		featureFlags: {},
		commandHistory: [],
		lastViewedNewsAt: null,
		openDesignerPanels: ["general"],
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

export function createBaseQuery(
	settings: SurrealistSettings,
	type: QueryType,
	query?: string,
): QueryTab {
	return {
		id: newId(),
		type,
		query: query ?? "",
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

export function createCloudInstance(): CloudInstance {
	return {
		id: "",
		host: "",
		name: "",
		region: "",
		version: "",
		state: "inactive",
		compute_units: 0,
		type: {
			slug: "",
			description: "",
			cpu: 0,
			memory: 0,
			price_hour: 0,
			compute_units: {},
			category: "",
		},
	};
}
