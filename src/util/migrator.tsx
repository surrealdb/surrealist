import { Connection, ConnectionOptions, ResultMode, SurrealistConfig, TabQuery } from "~/types";
import { createBaseConfig, createBaseConnection, createBaseConnectionOptions } from "./defaults";
import { newId } from "./helpers";

type LegacyAuthMode = "none" | "root" | "namespace" | "database" | "scope";
type LegacyDesignerNodeMode = "fields" | "summary" | "simple";
type LegacyDriverType = "file" | "memory" | "tikv";
type LegacyResultListing = "table" | "json" | "combined";

interface LegacyConnectionOptions {
	namespace: string;
	database: string;
	endpoint: string;
	username: string;
	password: string;
	authMode: LegacyAuthMode;
	scope: string;
	scopeFields: LegacyScopeField[];
}

interface LegacyScopeField {
	subject: string;
	value: string;
}

interface LegacyEnvironment {
	id: string;
	name: string;
	connection: Partial<LegacyConnectionOptions>;
}

interface LegacySession {
	id: string;
	name: string;
	activeQueryId: number;
	queries: LegacySessionQuery[];
	connection: LegacyConnectionOptions;
	pinnedTables: string[];
	designerNodeMode?: LegacyDesignerNodeMode;
}

interface LegacySessionQuery {
	id: number;
	text: string;
	name?: string;
}

interface LegacyFavoritesEntry {
	id: string;
	query: string;
	name: string;
}

interface LegacyConfig {
	tabs: LegacySession[];
	environments: LegacyEnvironment[];
	isPinned: boolean;
	activeTab: string | null;
	autoConnect: boolean;
	tableSuggest: boolean;
	wordWrap: boolean;
	queryFavorites: LegacyFavoritesEntry[];
	localDriver: LegacyDriverType;
	localStorage: string;
	surrealPath: string;
	surrealUser: string;
	surrealPass: string;
	surrealPort: number;
	updateChecker: boolean;
	resultListing: LegacyResultListing;
	fontZoomLevel: number;
	errorChecking: boolean;
	defaultDesignerNodeMode: LegacyDesignerNodeMode;
}

function migrateConnectionOptions(legacy: LegacyConnectionOptions): ConnectionOptions {
	return {
		...createBaseConnectionOptions(),
		authMode: legacy.authMode,
		namespace: legacy.namespace,
		database: legacy.database,
		hostname: legacy.endpoint.replace(/(ws|wss|http|https):\/\//, "") || "localhost:8000",
		username: legacy.username,
		password: legacy.password,
		protocol: legacy.endpoint.startsWith("ws") ? "ws" : "http",
		scope: legacy.scope,
		scopeFields: legacy.scopeFields,
	};
}

function migrateResultMode(legacy: LegacyResultListing): ResultMode {
	return legacy === "json" ? "single" : legacy;
}

export function migrateLegacyConfig(legacy: LegacyConfig): SurrealistConfig {
	const config = createBaseConfig();

	if (legacy.tabs) {
		for (const tab of legacy.tabs) {
			const queries: TabQuery[] = [];
			const idIndex = new Map<number, string>();

			for (const query of tab.queries) {
				const id = newId();

				idIndex.set(query.id, id);

				queries.push({
					id,
					query: query.text,
					name: query.name || 'Untitled query',
					variables: "{}",
					valid: true,
					resultMode: config.settings.appearance.defaultResultMode
				});
			}

			const connection: Connection = {
				...createBaseConnection(config.settings),
				id: tab.id,
				name: tab.name,
				connection: migrateConnectionOptions(tab.connection),
				pinnedTables: tab.pinnedTables,
				diagramMode: tab.designerNodeMode || 'fields',
				queries,
			};

			const activeQuery = idIndex.get(tab.activeQueryId);

			if (activeQuery) {
				connection.activeQuery = activeQuery;
			}

			config.connections.push(connection);
		}
	}

	if (legacy.environments) {
		for (const env of legacy.environments) {
			if (env.name == "Default") continue;

			config.settings.templates.list.push({
				id: env.id,
				name: env.name,
				icon: 0,
				values: migrateConnectionOptions({
					endpoint: "",
					authMode: "root",
					database: "",
					namespace: "",
					username: "",
					password: "",
					scope: "",
					scopeFields: [],
					...env.connection
				})
			});
		}
	}

	if (legacy.queryFavorites) {
		for (const fav of legacy.queryFavorites) {
			config.savedQueries.push({
				...fav,
				tags: []
			});
		}
	}

	config.previousVersion = "1.11.8";
	config.activeConnection = legacy.activeTab;
	config.settings.behavior.windowPinned = legacy.isPinned;
	config.settings.behavior.autoConnect = legacy.autoConnect;
	config.settings.behavior.tableSuggest = legacy.tableSuggest;
	config.settings.appearance.resultWordWrap = legacy.wordWrap;
	config.settings.serving.driver = legacy.localDriver;
	config.settings.serving.storage = legacy.localStorage;
	config.settings.serving.username = legacy.surrealUser;
	config.settings.serving.password = legacy.surrealPass;
	config.settings.serving.port = legacy.surrealPort;
	config.settings.behavior.updateChecker = legacy.updateChecker;
	config.settings.behavior.queryErrorChecker = legacy.errorChecking;
	config.settings.appearance.defaultDiagramMode = legacy.defaultDesignerNodeMode;
	config.settings.appearance.defaultResultMode = migrateResultMode(legacy.resultListing);
	config.settings.appearance.editorScale = legacy.fontZoomLevel * 100;

	return config;
}