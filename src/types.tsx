import type { ElementProps, MantineColorScheme } from "@mantine/core";
import type { AnyAuth, Duration, Token } from "surrealdb";
import type { FeatureFlagMap } from "./util/feature-flags";

export type AccessType = "JWT" | "RECORD";
export type AlertLevel = "info" | "warning" | "important";
export type AuthLevel = "root" | "namespace" | "database";
export type AuthType = "user" | "access";
export type Base = "ROOT" | "NAMESPACE" | "DATABASE";
export type ColorScheme = "light" | "dark";
export type DatabaseListMode = "list" | "grid";
export type DiagramAlgorithm = "default" | "aligned" | "spaced";
export type DiagramDirection = "default" | "ltr" | "rtl";
export type DiagramLineStyle = "default" | "metro" | "straight" | "smooth";
export type DiagramLinks = "default" | "hidden" | "visible";
export type DiagramMode = "default" | "fields" | "summary" | "simple";
export type DriverType = "file" | "surrealkv" | "memory" | "tikv";
export type InvoiceStatus = "succeeded" | "pending" | "failed";
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";
export type MiniAppearance = "normal" | "compact" | "plain";
export type Orientation = "horizontal" | "vertical";
export type Platform = "darwin" | "windows" | "linux";
export type Protocol = "http" | "https" | "ws" | "wss" | "mem" | "indxdb";
export type ResultFormat = "json" | "sql";
export type ResultMode = "table" | "single" | "combined" | "live";
export type ScaleStep = "75" | "90" | "100" | "110" | "125" | "150";
export type SchemaMode = "schemaless" | "schemafull";
export type Screen = "start" | "database";
export type SidebarMode = "expandable" | "compact" | "wide" | "fill";
export type SourceMode = "schema" | "infer";
export type SyntaxTheme = "default" | "vivid";
export type TableType = "ANY" | "NORMAL" | "RELATION";
export type UrlTarget = "internal" | "external";
export type ViewRequirement = "database";
export type QueryType = "config" | "file";

export type InstanceState = "creating" | "updating" | "deleting" | "ready" | "inactive";
export type AuthState = "unknown" | "loading" | "authenticated" | "unauthenticated";
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
	| "chat"
	| "data"
	| "audits"
	| "billing"
	| "support"
	| "settings"
	| "provision";
export type CodeLang = "cli" | "rust" | "js" | "go" | "py" | "csharp" | "java" | "php" | "c";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type KeyBindings = Record<string, string[]>;
export type Open<T> = T & { [key: string]: any };
export type FeatureCondition<R = boolean> = (flags: FeatureFlagMap) => R;
export type Selectable<T extends string = string> = { label: string; value: T };
export type Selection<T extends string = string> = Selectable<T>[];
export type Listable<T extends string = string> = Selectable<T> & {
	description?: string;
	icon?: string;
};
export type Snippets = Partial<Record<CodeLang, string>>;
export type AuthDetails = AnyAuth | Token | undefined;
export type Identified<T = object, I = string> = T & { id: I };
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
	queries: QueryTab[];
	activeQuery: string;
	queryHistory: HistoryQuery[];
	authentication: Authentication;
	pinnedTables: string[];
	diagramAlgorithm: DiagramAlgorithm;
	diagramDirection: DiagramDirection;
	diagramLineStyle: DiagramLineStyle;
	diagramLinkMode: DiagramLinks;
	diagramMode: DiagramMode;
	designerTableList: boolean;
	explorerTableList: boolean;
	queryTabList: boolean;
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
	queryQuickClose: boolean;
}

export interface SurrealistAppearanceSettings {
	colorScheme: MantineColorScheme;
	syntaxTheme: SyntaxTheme;
	windowScale: number;
	editorScale: number;
	queryLineNumbers: boolean;
	inspectorLineNumbers: boolean;
	functionLineNumbers: boolean;
	resultWordWrap: boolean;
	defaultResultMode: ResultMode;
	defaultResultFormat: ResultFormat;
	defaultDiagramAlgorithm: DiagramAlgorithm;
	defaultDiagramDirection: DiagramDirection;
	defaultDiagramLineStyle: DiagramLineStyle;
	defaultDiagramLinkMode: DiagramLinks;
	defaultDiagramMode: DiagramMode;
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

export interface QueryTab {
	id: string;
	type: QueryType;
	query: string; // NOTE Query string for config type, path for file type
	name?: string;
	variables: string;
	valid: boolean; // TODO Remove
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
	activeResource: string;
	activeScreen: Screen;
	activeConnection: string;
	activeCloudOrg: string;
	savedQueries: SavedQuery[];
	lastPromptedVersion: string | null;
	lastViewedNewsAt: number | null;
	settings: SurrealistSettings; // TODO Rename to preferences and flatten inner objects
	keybindings: KeyBindings;
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
	};
	verify:
		| {
				url: string;
		  }
		| {
				alg: string;
				key: string;
		  };
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
	enforced?: boolean;
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
	};
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
	kind:
		| {
				kind: "JWT";
				jwt: AccessJwt;
		  }
		| {
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

export interface SchemaNamespace {
	name: string;
}

export interface SchemaDatabase {
	name: string;
}

export interface SchemaInfoKV {
	namespaces: SchemaNamespace[];
	accesses: SchemaAccess[];
	users: SchemaUser[];
}

export interface SchemaInfoNS {
	databases: SchemaDatabase[];
	accesses: SchemaAccess[];
	users: SchemaUser[];
}

export interface SchemaInfoDB {
	functions: SchemaFunction[];
	models: SchemaModel[];
	accesses: SchemaAccess[];
	tables: SchemaTable[];
	users: SchemaUser[];
	analyzers: any[]; // unused
	params: any[]; // unused
}

export interface SchemaInfoTB {
	events: SchemaEvent[];
	fields: SchemaField[];
	indexes: SchemaIndex[];
	tables: any[]; // unused
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

export interface Dataset {
	name: string;
	path: string;
}

export interface Driver {
	id: CodeLang;
	name: string;
	icon: React.FC<{ active?: boolean } & ElementProps<"svg">>;
	link: string;
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
	compute_units: number;
	state: InstanceState;
	type: CloudInstanceType;
}

export interface CloudInstanceType {
	slug: string;
	display_name: string;
	description: string;
	cpu: number;
	memory: number;
	price_hour: number;
	enabled?: boolean;
	category: string;
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
	max_free_instances: number;
	max_paid_instances: number;
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

export interface CloudChatMessage {
	id: string;
	content: string;
	sender: "user" | "assistant";
	loading: boolean;
	sources?: {
		header: string;
		links: {
			url: string;
			title: string;
			img_url: string;
		}[];
	};
}

export interface CloudMeasurement {
	instance_id: string;
	instance_type?: string;
	compute_hours?: number;
	disk_used_bytes?: number;
	measured_period_start: string;
	measured_period_end: string;
}
