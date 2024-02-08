import { MantineColorScheme } from "@mantine/core";

export type AuthMode = "none" | "root" | "namespace" | "database" | "scope";
export type DriverType = "file" | "memory" | "tikv";
export type ResultMode = "table" | "json" | "combined";
export type ViewMode = "query" | "explorer" | "designer" | "authentication" | "live";
export type SourceMode = "schema" | "infer";
export type DesignerNodeMode = "fields" | "summary" | "simple";
export type DesignerLayoutMode = "diagram" | "grid";
export type IndexKind = "normal" | "unique" | "search" | "vector";
export type ColorScheme = "light" | "dark";
export type Protocol = "http" | "https" | "ws" | "wss" | "mem";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type Open<T> = T & { [key: string]: any };

export type Selectable<T extends string> = { label: string, value: T };

export interface SurrealistConfig {
	colorScheme: MantineColorScheme;
	connections: Connection[];
	sandbox: Connection;
	activeView: ViewMode;
	isPinned: boolean;
	activeConnection: string | null;
	autoConnect: boolean;
	tableSuggest: boolean;
	wordWrap: boolean;
	savedQueries: SavedQuery[];
	localSurrealDriver: DriverType;
	localSurrealStorage: string;
	localSurrealPath: string;
	localSurrealUser: string;
	localSurrealPass: string;
	localSurrealPort: number;
	updateChecker: boolean;
	resultMode: ResultMode;
	fontZoomLevel: number;
	errorChecking: boolean;
	lastPromptedVersion: string | null;
	defaultDesignerNodeMode: DesignerNodeMode,
	defaultDesignerLayoutMode: DesignerLayoutMode
}

export interface Connection {
	id: string;
	name: string;
	queries: TabQuery[];
	activeQueryId: number;
	lastQueryId: number;
	variables: string;
	connection: ConnectionOptions;
	lastResponse: any;
	pinnedTables: string[];
	designerNodeMode?: DesignerNodeMode;
	designerLayoutMode?: DesignerLayoutMode;
	liveQueries: LiveQuery[];
	queryHistory: HistoryQuery[];
}

export interface TabQuery {
	id: number;
	text: string;
	name?: string;
}

export interface HistoryQuery {
	id: string;
	query: string;
	timestamp: number;
}

export interface SavedQuery {
	id: string;
	query: string;
	name: string;
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

export interface ConnectionOptions {
	namespace: string;
	database: string;
	protocol: Protocol;
	hostname: string;
	username: string;
	password: string;
	authMode: AuthMode;
	scope: string;
	scopeFields: ScopeField[];
}

export interface SurrealOptions {
	connection: Connection;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: any) => void;
}

export interface LiveMessage {
	id: string;
	timestamp: number;
	query: LiveQuery;
	action: string;
	result: any;
}