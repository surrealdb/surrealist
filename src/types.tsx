import type { MantineColorScheme } from "@mantine/core";
import type { AnyAuth, Duration, Token } from "surrealdb";
import type { FeatureFlagMap } from "./util/feature-flags";

export type ViewRequirement = "database";
export type Screen = "start" | "database";
export type AlertLevel = "info" | "warning" | "important";
export type DriverType = "file" | "surrealkv" | "memory" | "tikv";
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";
export type ResultMode = "table" | "single" | "combined" | "live";
export type ResultFormat = "json" | "sql";
export type SourceMode = "schema" | "infer";
export type DiagramMode = "fields" | "summary" | "simple";
export type DiagramDirection = "ltr" | "rtl";
export type ColorScheme = "light" | "dark";
export type Platform = "darwin" | "windows" | "linux";
export type TableType = "ANY" | "NORMAL" | "RELATION";
export type SidebarMode = "expandable" | "compact" | "wide" | "fill";
export type Orientation = "horizontal" | "vertical";
export type Protocol = "http" | "https" | "ws" | "wss" | "mem" | "indxdb";
export type LineStyle = "metro" | "straight" | "smooth";
export type SchemaMode = "schemaless" | "schemafull";
export type UrlTarget = "internal" | "external";
export type DatabaseListMode = "list" | "grid";
export type AuthLevel = "root" | "namespace" | "database";
export type InvoiceStatus = "succeeded" | "pending" | "failed";
export type AuthType = "user" | "access";
export type AccessType = "JWT" | "RECORD";
export type Base = "ROOT" | "NAMESPACE" | "DATABASE";

export type InstanceState =
	| "creating"
	| "updating"
	| "deleting"
	| "ready"
	| "inactive";
export type AuthState =
	| "unknown"
	| "loading"
	| "authenticated"
	| "unauthenticated";
export type AuthMode =
	| "none"
	| "root"
	| "namespace"
	| "database"
	| "token"
	| "scope"
	| "scope-signup"
	| "access"
	| "access-signup"
	| "cloud";
export type ViewMode =
	| "cloud"
	| "query"
	| "explorer"
	| "graphql"
	| "designer"
	| "authentication"
	| "functions"
	| "models"
	| "documentation";
export type CloudPage =
	| "instances"
	| "members"
	| "data"
	| "audits"
	| "billing"
	| "support"
	| "settings"
	| "provision";
export type CodeLang = "cli" | "rust" | "js" | "go" | "py" | "csharp" | "java" | "php";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type Open<T> = T & { [key: string]: any };
export type FeatureCondition<R = boolean> = (flags: FeatureFlagMap) => R;
export type Selectable<T extends string = string> = { label: string; value: T };
export type Selection<T extends string> = Selectable<T>[];
export type Listable<T extends string> = Selectable<T> & { description?: string, icon?: string };
export type Snippets = Partial<Record<CodeLang, string>>;
export type AuthDetails = AnyAuth | Token | undefined;
export type PartialId<T extends { id: I }, I = string> = Pick<T, "id"> & Partial<T>;
export type Assign<T, O extends object> = Omit<T, keyof O> & O;
export type AuthTarget = [AuthType, string];

export interface Authentication {
	mode: AuthMode;
	protocol: Protocol;
	hostname: string;
	username: string;
	password: string;
	namespace: string;
	database: string;
	token: string;
	scope: string;
	access: string;
	accessFields: AccessField[];
	cloudInstance?: string;
}

export interface Connection {
	id: string;
	name: string;
	icon: number;
	group?: string;
	lastNamespace: string;
	lastDatabase: string;
	queries: TabQuery[];
	activeQuery: string;
	queryHistory: HistoryQuery[];
	authentication: Authentication;
	pinnedTables: string[];
	diagramMode: DiagramMode;
	diagramDirection: DiagramDirection;
	diagramShowLinks: boolean;
	designerTableList: boolean;
	graphqlQuery: string;
	graphqlVariables: string;
	graphqlShowVariables: boolean;
}

export interface Template {
	id: string;
	name: string;
	icon: number;
	values: Authentication;
	group?: string;
}

export interface ConnectionGroup {
	id: string;
	name: string;
}

export interface SurrealistBehaviorSettings {
	updateChecker: boolean;
	tableSuggest: boolean;
	variableSuggest: boolean;
	queryErrorChecker: boolean;
	windowPinned: boolean;
	docsLanguage: CodeLang;
	versionCheckTimeout: number;
	reconnectInterval: number;
}

export interface SurrealistAppearanceSettings {
	colorScheme: MantineColorScheme;
	windowScale: number;
	editorScale: number;
	resultWordWrap: boolean;
	defaultResultMode: ResultMode;
	defaultResultFormat: ResultFormat;
	defaultDiagramMode: DiagramMode;
	defaultDiagramDirection: DiagramDirection;
	defaultDiagramShowLinks: boolean;
	lineStyle: LineStyle;
	sidebarMode: SidebarMode;
	queryOrientation: Orientation;
}

export interface SurrealistTemplateSettings {
	list: Template[];
}

export interface SurrealistServingSettings {
	driver: DriverType;
	logLevel: LogLevel;
	storage: string;
	executable: string;
	username: string;
	password: string;
	port: number;
	historySize: number;
}

export interface SurrealistCloudSettings {
	databaseListMode: DatabaseListMode;
	urlApiBase: string;
	urlApiMgmtBase: string;
	urlAuthBase: string;
}

export interface QueryResponse {
	execution_time: string;
	success: boolean;
	result: any;
}

export interface TabQuery {
	id: string;
	query: string;
	name?: string;
	variables: string;
	valid: boolean;
	resultMode: ResultMode;
	resultFormat: ResultFormat;
	showVariables: boolean;
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
	cloud: SurrealistCloudSettings;
}

export interface SurrealistConfig {
	configVersion: number;
	previousVersion: string;
	connections: Connection[];
	connectionGroups: ConnectionGroup[];
	sandbox: Connection;
	activeView: ViewMode;
	activeScreen: Screen;
	activeConnection: string;
	activeCloudPage: CloudPage;
	activeCloudOrg: string;
	savedQueries: SavedQuery[];
	lastPromptedVersion: string | null;
	lastViewedNewsAt: number | null;
	settings: SurrealistSettings;
	featureFlags: Partial<FeatureFlagMap>;
	openDesignerPanels: string[];
	commandHistory: string[];
	onboarding: string[];
}

export interface AccessField {
	subject: string;
	value: string;
}

export interface AccessJwt {
	issuer: {
		alg: string;
		key: string;
	},
	verify: {
		url: string;
	} | {
		alg: string;
		key: string;
	}
}

export interface TableView {
	expr: string;
	cond: string;
	group: string;
}

export interface Permissions {
	select: boolean | string;
	create: boolean | string;
	update: boolean | string;
	delete: boolean | string;
}

export interface Kind {
	kind: TableType;
	in?: string[];
	out?: string[];
}

export type RootSchema = SchemaInfoKV;
export type NamespaceSchema = SchemaInfoNS;

export interface ConnectionSchema {
	root: RootSchema;
	namespace: NamespaceSchema;
	database: DatabaseSchema;
}

export interface DatabaseSchema {
	functions: SchemaFunction[];
	models: SchemaModel[];
	accesses: SchemaAccess[];
	tables: TableInfo[];
	users: SchemaUser[];
}

export interface SchemaTable {
	name: string;
	drop: boolean;
	full: boolean;
	permissions: Permissions;
	kind: Kind;
	view?: string;
	changefeed?: { expiry: string; store_original: boolean };
}

export interface SchemaField {
	name: string;
	flex: boolean;
	readonly: boolean;
	kind?: string;
	value?: string;
	assert?: string;
	default?: string;
	permissions: Permissions;
}

export interface SchemaIndex {
	name: string;
	cols: string;
	index: string;
}

export interface SchemaEvent {
	name: string;
	when: string;
	then: string[];
}

export interface SchemaUser {
	name: string;
	base: string;
	hash: string;
	roles: string[];
	comment?: string;
	duration: {
		session: Duration;
		token: Duration;
	}
}

export interface SchemaAccess {
	name: string;
	base: string;
	authenticate?: string;
	comment?: string;
	duration: {
		session: Duration;
		token: Duration;
	};
	kind: {
		kind: "JWT";
		jwt: AccessJwt;
	} | {
		kind: "RECORD";
		signin: string;
		signup: string;
		jwt: AccessJwt;
	};
}

export interface SchemaFunction {
	name: string;
	block: string;
	args: [string, string][];
	permissions: boolean | string;
	comment: string;
	returns: string;
}

export interface SchemaModel {
	name: string;
	hash: string;
	version: string;
	permission: boolean | string;
	comment: string;
}

export interface TableInfo {
	schema: SchemaTable;
	fields: SchemaField[];
	indexes: SchemaIndex[];
	events: SchemaEvent[];
}

export interface SchemaInfoKV {
	namespaces: any[];
	accesses: SchemaAccess[];
	users: SchemaUser[];
}

export interface SchemaInfoNS {
	databases: any[];
	accesses: SchemaAccess[];
	users: SchemaUser[];
}

export interface SchemaInfoDB {
	functions: SchemaFunction[];
	models: SchemaModel[];
	accesses: SchemaAccess[];
	tables: SchemaTable[];
	users: SchemaUser[];
	analyzers: any[];	// unused
	params: any[];		// unused
}

export interface SchemaInfoTB {
	events: SchemaEvent[];
	fields: SchemaField[];
	indexes: SchemaIndex[];
	tables: any[];		// unused
}

export interface SurrealOptions {
	connection: Authentication;
	onConnect?: (version: string) => void;
	onDisconnect?: (code: number, reason: string) => void;
	onError?: (error: string) => void;
}

export interface LiveMessage {
	id: string;
	action: string;
	queryId: string;
	timestamp: number;
	data: any;
}

export interface ViewInfo {
	id: ViewMode;
	name: string;
	icon: string;
	anim?: any;
	desc: string;
	require?: ViewRequirement;
	disabled?: FeatureCondition;
}

export interface CloudPageInfo {
	id: CloudPage;
	name: string;
	icon: string;
	disabled?: FeatureCondition;
}

export interface DataSet {
	name: string;
	url: string;
}

export interface CloudSignin {
	token: string;
	terms_accepted_at?: string;
}

export interface CloudProfile {
	username: string;
	default_org: string;
	name: string;
	picture?: string;
}

export interface CloudInstance {
	id: string;
	name: string;
	host: string;
	region: string;
	version: string;
	state: InstanceState;
	type: CloudInstanceType;
}

export interface CloudInstanceType {
	slug: string;
	description: string;
	cpu: number;
	memory: number;
	storage: number;
	price_hour: number;
	enabled?: boolean;
	compute_units: {
		min?: number;
		max?: number;
	};
}

export interface CloudRegion {
	slug: string;
	description: string;
}

export interface CloudPlan {
	id: string;
	name: string;
	description: string;
	regions: string[];
	instance_types: CloudInstanceType[];
}

export interface CloudOrganization {
	id: string;
	name: string;
	billing_info: boolean;
	payment_info: boolean;
	plan: CloudPlan;
	available_plans: CloudPlan[];
}

export interface CloudAlert {
	message: string;
	message_type: AlertLevel;
	timestamp: string;
}

export interface CloudBilling {
	Name: string;
	Email: string;
	AddressLine1: string;
	AddressLine2: string;
	City: string;
	Zipcode: string;
	State: string;
	Country: string;
	LegalName: string;
	TaxIdentificationNumber: string;
	Phone: string;
}

export interface CloudInvoice {
	id: string;
	date: string;
	amount: number;
	status: InvoiceStatus;
	url: string;
}

export interface CloudPayment {
	payment_info: boolean;
	info?: {
		card_last4?: string;
		card_brand?: string;
	};
}

export interface CloudBillingCountry {
	name: string;
	code: string;
}
