import { ColorScheme } from "@mantine/core";

export type AuthMode = 'none' | 'root' | 'namespace' | 'database' | 'scope';
export type DriverType = "file" | "memory" | "tikv";
export type QueryListing = "history" | "favorites";
export type ResultListing = "table" | "json";
export type ViewMode = 'query' | 'explorer' | 'visualizer' | 'designer' | 'auth';
export type SourceMode = 'schema' | 'infer';

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, 'asc' | 'desc'];
export type Open<T> = T & { [key: string]: any };

export interface SurrealistConfig {
	theme: ColorScheme | 'automatic';
	tabs: SurrealistTab[];
	environments: SurrealistEnvironment[];
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
	errorChecking: boolean;
	lastPromptedVersion: string | null;
	tabSearch: boolean;
}

export interface SurrealistEnvironment {
	id: string;
	name: string;
	connection: Partial<ConnectionOptions>;
}

export interface SurrealistTab {
	id: string;
	name: string;
	environment: string;
	query: string;
	variables: string;
	connection: ConnectionOptions;
	lastResponse: any;
	activeView: ViewMode;
	pinned: boolean;
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
}

export interface TableField {
	name: string;
	flexible: boolean;
	kind: string;
	kindTables: string[];
	kindGeometry: string[];
	value: string;
	assert: string;
	permissions: Permissions;
}

export interface TableIndex {
	name: string;
	fields: string;
	unique: boolean;
}

export interface TableEvent {
	name: string;
	cond: string;
	then: string;
}

export interface TableDefinition {
	schema: TableSchema;
	fields: TableField[];
	indexes: TableIndex[];
	events: TableEvent[];
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

export interface SurrealHandle {
	close(): void;
	query(query: string, params?: Record<string, any>): Promise<any>;
	querySingle(query: string): Promise<any>;
}