import type { ElementProps, MantineColorScheme } from "@mantine/core";
import { AboutMetadata } from "@tauri-apps/api/menu";
import type { AnyAuth, Duration, RecordId, Token } from "surrealdb";
import type { FeatureFlagMap } from "./util/feature-flags";

export type AccessType = "JWT" | "RECORD";
export type BannerType = "info" | "warning" | "important";
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
export type MetricsDuration = "hour" | "half" | "day" | "week" | "month";
export type MiniAppearance = "normal" | "compact" | "plain";
export type Orientation = "horizontal" | "vertical";
export type Platform = "darwin" | "windows" | "linux";
export type Protocol = "http" | "https" | "ws" | "wss" | "mem" | "indxdb";
export type ResultFormat = "json" | "sql";
export type ResultMode = "table" | "single" | "combined" | "graph" | "live";
export type ScaleStep = "75" | "90" | "100" | "110" | "125" | "150";
export type SchemaMode = "schemaless" | "schemafull";
export type SidebarMode = "expandable" | "compact" | "wide" | "fill";
export type StorageCategory = "standard" | "advanced";
export type InstancePlan = "free" | "start" | "scale" | "enterprise";
export type SourceMode = "schema" | "infer";
export type SyntaxTheme = "default" | "vivid";
export type TableType = "ANY" | "NORMAL" | "RELATION";
export type TableVariant = "normal" | "relation" | "view";
export type UrlTarget = "internal" | "external";
export type ViewRequirement = "database";
export type QueryType = "config" | "file";
export type AuthState = "unknown" | "loading" | "authenticated" | "unauthenticated";
export type MonitorType = "metrics" | "logs";
export type MonitorSeverity = "info" | "warning" | "error";
export type FunctionType = "function" | "model";

export type InstanceState =
	| "creating"
	| "updating"
	| "deleting"
	| "ready"
	| "pausing"
	| "paused"
	| "resuming";
export type AuthMode =
	| "none"
	| "root"
	| "namespace"
	| "database"
	| "token"
	| "access"
	| "access-signup"
	| "cloud";
export type GlobalPage =
	| "/overview"
	| "/signin"
	| "/organisations"
	| "/support"
	| "/referrals"
	| "/mini/new";
export type ViewPage =
	| "dashboard"
	| "monitor"
	| "query"
	| "explorer"
	| "graphql"
	| "designer"
	| "authentication"
	| "functions"
	| "parameters"
	| "documentation";

export type AppMenuItemType =
	| "Separator"
	| "Copy"
	| "Cut"
	| "Paste"
	| "SelectAll"
	| "Undo"
	| "Redo"
	| "Minimize"
	| "Maximize"
	| "Fullscreen"
	| "Hide"
	| "HideOthers"
	| "ShowAll"
	| "CloseWindow"
	| "Quit"
	| "Services"
	| "Command"
	| "Custom"
	| {
			About: AboutMetadata | null;
	  };

export type CodeLang = "cli" | "rust" | "js" | "go" | "py" | "csharp" | "java" | "php" | "c";

export type OpenFn = (id: string | null) => void;
export type ColumnSort = [string, "asc" | "desc"];
export type KeyBindings = Record<string, string[]>;
export type Open<T> = T & { [key: string]: any };
export type FeatureCondition<R = boolean> = (flags: FeatureFlagMap) => R;
export type Selectable<T extends string = string> = { label: string; value: T };
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
export type Flags<T extends string> = Partial<Record<T, boolean>>;

export interface Authentication {
	mode: AuthMode;
	protocol: Protocol;
	hostname: string;
	username: string;
	password: string;
	namespace: string;
	database: string;
	token: string;
	access: string;
	accessFields: AccessField[];
	cloudInstance?: string;
}

export interface Connection {
	id: string;
	name: string;
	icon: number;
	labels?: string[];
	instance?: boolean;
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
	graphLabels?: Record<string, string[]>;
	graphShowStray?: boolean;
	graphStraightEdges?: boolean;
}

export interface Template {
	id: string;
	name: string;
	icon: number;
	values: Authentication;
	labels?: string[];
}

export interface SurrealistBehaviorSettings {
	updateChecker: boolean;
	tableSuggest: boolean;
	variableSuggest: boolean;
	queryErrorChecker: boolean;
	querySelectionExecution: boolean;
	querySelectionExecutionWarning: boolean;
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
	sidebarViews: Flags<ViewPage>;
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

export interface SurrealistGtmSettings {
	preview_header: string;
	origin: "app.surrealdb.com" | "beta-app.surrealdb.com" | "dev-app.surrealdb.com";
	debug_mode: boolean;
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
	gtm: SurrealistGtmSettings;
}

export interface SurrealistConfig {
	configVersion: number;
	previousVersion: string;
	connections: Connection[];
	sandbox: Connection;
	activeResource: string;
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
	params: SchemaParameter[];
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

export interface SchemaParameter {
	name: string;
	permissions: boolean | string;
	value: string;
	comment?: string;
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

export interface FunctionDetails {
	type: FunctionType;
	details: SchemaFunction | SchemaModel;
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
	params: SchemaParameter[];
	models: SchemaModel[];
	accesses: SchemaAccess[];
	tables: SchemaTable[];
	users: SchemaUser[];
	analyzers: any[]; // unused
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

export interface GlobalPageInfo {
	id: GlobalPage;
	name: string;
	icon: string;
	aliases?: string[];
	disabled?: (condition: GlobalCondition) => boolean;
}

export interface GlobalCondition {
	flags: FeatureFlagMap;
}

export interface ViewPageInfo {
	id: ViewPage;
	name: string;
	icon: string;
	anim?: any;
	disabled?: (condition: ViewCondition) => boolean;
}

export interface ViewCondition {
	flags: FeatureFlagMap;
	connection: string;
	isCloud: boolean;
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

export interface SidekickChatMessage {
	id: RecordId | null;
	sent_at: Date;
	content: string;
	role: "user" | "assistant";
	sources?: {
		header: string;
		links: {
			url: string;
			title: string;
			img_url: string | null;
		}[];
	};
}

export interface SidekickChat {
	id: RecordId;
	author: string;
	title: string;
	last_activity: Date;
}

export interface CloudSignin {
	id: string;
	token: string;
	provider: string;
	terms_accepted_at?: string;
}

export interface CloudProfile {
	username: string;
	name: string;
	default_org: string;
	picture?: string;
	user_hmac?: string;
	enabled_features: string[];
}

export interface CloudInstance {
	id: string;
	name: string;
	host: string;
	region: string;
	version: string;
	organization_id: string;
	available_versions: string[];
	compute_units: number;
	storage_size: number;
	storage_size_updated_at?: string;
	can_update_storage_size: boolean;
	storage_size_update_cooloff_hours: number;
	capabilities: CloudInstanceCapabilities;
	state: InstanceState;
	type: CloudInstanceType;
	distributed_storage_specs?: CloudDistributedStorageSpecs;
}

export interface CloudInstanceCapabilities {
	allow_scripting: boolean;
	allow_guests: boolean;
	allow_graphql: boolean;
	allowed_rpc_methods: string[];
	denied_rpc_methods: string[];
	allowed_http_endpoints: string[];
	denied_http_endpoints: string[];
	allowed_networks: string[];
	denied_networks: string[];
	allowed_functions: string[];
	denied_functions: string[];
	allowed_experimental: string[];
	denied_experimental: string[];
	allowed_arbitrary_query: string[];
	denied_arbitrary_query: string[];
}

export interface CloudDistributedStorageSpecs {
	category: StorageCategory;
	autoscaling: boolean;
	max_compute_units: number;
}

export interface CloudInstanceType {
	slug: string;
	restricted?: boolean;
	display_name: string;
	description: string;
	cpu: number;
	memory: number;
	price_hour: number;
	enabled?: boolean;
	category: string;
	default_storage_size: number;
	max_storage_size: number;
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
	archived_at?: string;
	member_count: number;
}

export interface CloudBanner {
	message: string;
	message_type: BannerType;
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

export interface CloudMeasurement {
	instance_id: string;
	instance_type?: string;
	metric_type: string;
	measured_period_start: string;
	measured_period_end: string;

	// Compute
	compute_hours?: number;

	// Storage
	disk_used_bytes?: number;
	source?: string;
}

export interface CloudMetrics {
	metric: string;
	from_time: string;
	to_time: string;
	unit: string;
	values: {
		timestamps: string[];
		metrics: {
			labels: string;
			values: (number | null)[];
		}[];
	};
}

export interface CloudLogLine {
	timestamp: string;
	pod: string;
	level: string;
	message: string;
}

export interface CloudLogs {
	from_time: string;
	to_time: string;
	log_lines: CloudLogLine[];
}

export interface CloudCoupon {
	name: string;
	amount: number;
	amount_remaining: number;
	expires_at?: string;
}

export interface CloudBackup {
	snapshot_started_at: string;
	snapshot_id: string;
}

export interface CloudMember {
	user_id: string;
	organization_id: string;
	role: string;
	name: string;
	username: string;
	profile_picture: string;
}

export interface CloudInvitation {
	organization_id: string;
	code: string;
	role: string;
	email: string;
	status: string;
}

export interface CloudRole {
	name: string;
	permissions: {
		resource: string;
		action: string;
	}[];
}

export interface CloudDeployConfig {
	name: string;
	version: string;
	region: string;
	type: string;
	units: number;
	plan: InstancePlan;
	storageCategory: StorageCategory;
	storageAmount: number;
	dataset: boolean;
}

export interface AppMenu {
	id: string;
	name: string;
	disabled?: boolean;
	items: AppMenuItem[];
}

export interface AppMenuItem {
	id: string;
	type: AppMenuItemType;
	name?: string;
	data?: any;
	disabled?: boolean;
	binding?: string[];
	action?: () => void;
}

export interface ObserverMetric {
	id: string;
	name: string;
}

export interface ObserverMetricCollection {
	id: string;
	name: string;
	icon: string;
	metrics: ObserverMetric[];
}

export interface ObserverLogFeed {
	id: string;
	name: string;
	icon: string;
}

export interface Monitor {
	id: string;
	type: MonitorType;
	name: string;
}
