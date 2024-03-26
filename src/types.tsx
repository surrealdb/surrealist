import { MantineColorScheme } from "@mantine/core";
import { QueryResponse } from "./util/surreal";
import { TFeatureFlags } from "@theopensource-company/feature-flags";
import { FeatureFlagMap, featureFlagSchema } from "./util/feature-flags";

export type AuthMode = "none" | "root" | "namespace" | "database" | "token" | "scope" | "scope-signup";
export type DriverType = "file" | "memory" | "tikv";
export type ResultMode = "table" | "single" | "combined" | "live";
export type QueryType = "invalid" | "mixed" | "live" | "normal";
export type ViewMode = "query" | "explorer" | "designer" | "authentication" | "functions" | "models" | "documentation";
export type SourceMode = "schema" | "infer";
export type DiagramMode = "fields" | "summary" | "simple";
export type DiagramDirection = "ltr" | "rtl";
export type IndexKind = "normal" | "unique" | "search" | "vector";
export type ColorScheme = "light" | "dark";
export type Protocol = "http" | "https" | "ws" | "wss" | "mem" | "indxdb";
export type CodeLang = "cli" | "rust" | "js" | "go" | "py" | "dotnet" | "java" | "php";
export type Platform = "darwin" | "windows" | "linux";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type Open<T> = T & { [key: string]: any };
export type PartialId<T extends { id: I }, I = string> = Pick<T, "id"> & Partial<T>;
export type FeatureCondition = (flags: FeatureFlagMap) => boolean;
export type Selectable<T extends string> = { label: string, value: T };

export interface ConnectionOptions {
	namespace: string;
	database: string;
	protocol: Protocol;
	hostname: string;
	username: string;
	password: string;
	authMode: AuthMode;
	token: string;
	scope: string;
	scopeFields: ScopeField[];
}

export interface Connection {
	id: string;
	name: string;
	queries: TabQuery[];
	activeQuery: string;
	connection: ConnectionOptions;
	pinnedTables: string[];
	diagramMode: DiagramMode;
	diagramDirection: DiagramDirection;
	queryHistory: HistoryQuery[];
}

export interface Template {
	id: string;
	name: string;
	values: ConnectionOptions;
}

export interface SurrealistBehaviorSettings {
	updateChecker: boolean;
	tableSuggest: boolean;
	variableSuggest: boolean;
	queryErrorChecker: boolean;
	windowPinned: boolean;
	autoConnect: boolean;
	docsLanguage: CodeLang;
}

export interface SurrealistAppearanceSettings {
	colorScheme: MantineColorScheme;
	windowScale: number;
	editorScale: number;
	resultWordWrap: boolean;
	defaultResultMode: ResultMode;
	defaultDiagramMode: DiagramMode;
	defaultDiagramDirection: DiagramDirection;
	expandSidebar: boolean;
}

export interface SurrealistTemplateSettings {
	list: Template[];
}

export interface SurrealistServingSettings {
	driver: DriverType;
	storage: string;
	executable: string;
	username: string;
	password: string;
	port: number;
}

export interface TabQuery {
	id: string;
	query: string;
	name?: string;
	variables: string;
	response: QueryResponse[];
	queryType: QueryType;
	resultMode: ResultMode;
}

export interface HistoryQuery {
	id: string;
	query: string;
	timestamp: number;
	origin?: string;
}

export interface SavedQuery {
	id: string;
	query: string;
	name: string;
	tags: string[];
}

export interface SurrealistSettings {
	behavior: SurrealistBehaviorSettings;
	appearance: SurrealistAppearanceSettings;
	templates: SurrealistTemplateSettings;
	serving: SurrealistServingSettings;
}

export interface SurrealistConfig {
	configVersion: number;
	connections: Connection[];
	sandbox: Connection;
	activeView: ViewMode;
	activeConnection: string | null;
	savedQueries: SavedQuery[];
	lastPromptedVersion: string | null;
	settings: SurrealistSettings;
	featureFlags: Partial<TFeatureFlags<typeof featureFlagSchema>>;
	commandHistory: string[];
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
	functions: FunctionDefinition[];
	models: ModelDefinition[];
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

export interface FunctionDefinition {
	name: string;
	block: string;
	arguments: { name: string, kind: string }[];
	permission: string;
	comment: string;
}

export interface ModelDefinition {
	name: string;
	hash: string;
	version: string;
	permission: string;
	comment: string;
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

export interface SurrealOptions {
	connection: ConnectionOptions;
	onConnect?: () => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: string) => void;
}

export interface ViewInfo {
	id: ViewMode;
	name: string;
	icon: string;
	anim?: any;
	desc: string;
	disabled?: FeatureCondition;
}