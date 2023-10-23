import { ColorScheme } from "@mantine/core";

export type AuthMode = "none" | "root" | "namespace" | "database" | "scope";
export type DriverType = "file" | "memory" | "tikv";
export type QueryListing = "history" | "favorites";
export type ResultListing = "table" | "json" | "combined";
export type ViewMode = "query" | "explorer" | "designer" | "authentication" | "live";
export type SourceMode = "schema" | "infer";
export type DesignerNodeMode = "fields" | "summary" | "simple";
export type DesignerLayoutMode = "diagram" | "grid";
export type IndexKind = "normal" | "unique" | "search" | "vector";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type Open<T> = T & { [key: string]: any };

export interface SurrealistConfig {
	theme: ColorScheme | "automatic";
	tabs: SurrealistSession[];
	environments: SurrealistEnvironment[];
	activeUrl: string;
	isPinned: boolean,
	activeTab: string | null;
	autoConnect: boolean;
	tableSuggest: boolean;
	wordWrap: boolean;
	queryHistory: HistoryEntry[];
	queryFavorites: FavoritesEntry[];
	localDriver: DriverType;
	localStorage: string;
	surrealPath: string;
	surrealUser: string;
	surrealPass: string;
	surrealPort: number;
	enableConsole: boolean;
	enableListing: boolean;
	queryTimeout: number;
	updateChecker: boolean;
	queryListing: QueryListing;
	resultListing: ResultListing;
	fontZoomLevel: number;
	errorChecking: boolean;
	lastPromptedVersion: string | null;
	tabSearch: boolean;
	defaultDesignerNodeMode: DesignerNodeMode,
	defaultDesignerLayoutMode: DesignerLayoutMode
}

export interface SurrealistEnvironment {
	id: string;
	name: string;
	connection: Partial<ConnectionOptions>;
}

export interface SurrealistSession {
	id: string;
	name: string;
	environment: string;
	queries: SessionQuery[];
	activeQueryId: number;
	lastQueryId: number;
	variables: string;
	connection: ConnectionOptions;
	lastResponse: any;
	pinned: boolean;
	pinnedTables: string[];
	designerNodeMode?: DesignerNodeMode;
	designerLayoutMode?: DesignerLayoutMode;
	liveQueries: LiveQuery[];
}

export interface SessionQuery {
	id: number;
	text: string;
	name?: string;
}

export interface LiveQuery {
	id: string;
	name: string;
	text: string;
}

export interface ScopeField {
	subject: string;
	value: string;
}

export interface HistoryEntry {
	id: string;
	query: string;
	timestamp: number;
	tabName: string;
}

export interface FavoritesEntry {
	id: string;
	query: string;
	name: string;
}

export interface TableView {
	expr: string;
	what: string;
	cond: string;
	group: string;
}

export interface Permissions {
	select: string;
	create: string;
	update: string;
	delete: string;
}

export interface TableSchema {
	name: string;
	drop: boolean;
	schemafull: boolean;
	view: TableView | null;
	permissions: Permissions;
	changefeed: boolean;
	changetime: string;
}

export interface TableField {
	name: string;
	flexible: boolean;
	kind: string;
	kindTables: string[];
	value: string;
	default: string;
	assert: string;
	permissions: Permissions;
}

export interface TableIndex {
	name: string;
	fields: string;
	kind: IndexKind;
	search: string;
	vector: string;
}

export interface TableEvent {
	name: string;
	cond: string;
	then: string;
}

export interface DatabaseSchema {
	kvUsers: UserDefinition[];
	nsUsers: UserDefinition[];
	dbUsers: UserDefinition[];
	scopes: ScopeDefinition[];
	tables: TableDefinition[];
}

export interface UserDefinition {
	name: string;
	comment: string;
	roles: string[];
}

export interface ScopeDefinition {
	name: string;
	session: string | null;
	signin: string | null;
	signup: string | null;
}

export interface TableDefinition {
	schema: TableSchema;
	fields: TableField[];
	indexes: TableIndex[];
	events: TableEvent[];
}

export interface Analyzer {
	name: string;
	tokenizers: string[];
	filters: string[];
}

export interface TabCreation {
	environment?: string;
	name?: string;
	query?: string;
	connection?: Partial<ConnectionOptions>;
}

export interface ConnectionOptions {
	namespace: string;
	database: string;
	endpoint: string;
	username: string;
	password: string;
	authMode: AuthMode;
	scope: string;
	scopeFields: ScopeField[];
}

export interface SurrealOptions {
	connection: ConnectionOptions;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: any) => void;
}

export interface TablePinAction {
	session: string;
	table: string;
}

export interface LiveMessage {
	id: string;
	timestamp: number;
	query: LiveQuery;
	action: string;
	result: any;
}