import flagIE from "flag-icons/flags/4x3/ie.svg";
import flagUS from "flag-icons/flags/4x3/us.svg";

import {
	DotNetIcon,
	GoLangIcon,
	JavaIcon,
	JavaScriptIcon,
	PhpIcon,
	PythonIcon,
	RustIcon,
	SurrealIcon,
} from "./util/drivers";

import type {
	AuthMode,
	CloudPage,
	CloudPageInfo,
	CodeLang,
	Dataset,
	DiagramDirection,
	DiagramMode,
	Driver,
	LineStyle,
	Listable,
	Orientation,
	Protocol,
	ResultFormat,
	ResultMode,
	ScaleStep,
	SchemaMode,
	Selectable,
	Selection,
	SidebarMode,
	ViewInfo,
	ViewMode,
} from "./types";

import {
	iconAPI,
	iconAccount,
	iconAuth,
	iconBraces,
	iconCloud,
	iconCog,
	iconCombined,
	iconCreditCard,
	iconDataTable,
	iconDatabase,
	iconDesigner,
	iconEmail,
	iconExplorer,
	iconFunction,
	iconGraphql,
	iconLive,
	iconModuleML,
	iconPackageClosed,
	iconPlus,
	iconProgressClock,
	iconQuery,
	iconServer,
} from "./util/icons";

import type { MantineColorScheme } from "@mantine/core";

export type StructureTab = "graph" | "builder";
export type ExportType = (typeof EXPORT_TYPES)[number];
export type ProtocolOption = Selectable<Protocol> & { remote: boolean };

export const SANDBOX = "sandbox";
export const MAX_HISTORY_SIZE = 50;
export const MAX_HISTORY_QUERY_LENGTH = 7500;
export const MAX_LIVE_MESSAGES = 50;
export const SENSITIVE_ACCESS_FIELDS = new Set(["password", "pass", "secret"]);
export const ML_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);
export const GQL_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);

export const DATASETS: Record<string, Dataset> = {
	"surreal-deal-store": {
		name: "Surreal Deal Store",
		path: "/surreal-deal-store-mini.surql",
	},
};

export const SCALE_STEPS: Selection<ScaleStep> = [
	{ label: "150%", value: "150" },
	{ label: "125%", value: "125" },
	{ label: "100%", value: "100" },
	{ label: "75%", value: "75" },
	{ label: "50%", value: "50" },
];

export const THEMES: Selection<MantineColorScheme> = [
	{ label: "Automatic", value: "auto" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export const RESULT_MODES: Listable<ResultMode>[] = [
	{
		label: "Combined",
		value: "combined",
		icon: iconCombined,
		description: "View all results in a single list",
	},
	{
		label: "Individual",
		value: "single",
		icon: iconQuery,
		description: "Inspect each result individually",
	},
	{
		label: "Table",
		value: "table",
		icon: iconDataTable,
		description: "Render query results in a table",
	},
	{
		label: "Live",
		value: "live",
		icon: iconLive,
		description: "Subscribe to live query results",
	},
];

export const RESULT_FORMATS: Listable<ResultFormat>[] = [
	{
		label: "SurrealQL",
		value: "sql",
		icon: iconDatabase,
		description: "Format results in full SurrealQL",
	},
	{
		label: "JSON",
		value: "json",
		icon: iconBraces,
		description: "Format results in classic JSON",
	},
];

export const CONNECTION_PROTOCOLS: ProtocolOption[] = [
	{ label: "HTTP", value: "http", remote: true },
	{ label: "HTTPS", value: "https", remote: true },
	{ label: "WS", value: "ws", remote: true },
	{ label: "WSS", value: "wss", remote: true },
	{ label: "Memory", value: "mem", remote: false },
	{ label: "IndexedDB", value: "indxdb", remote: false },
];

export const AUTH_MODES: Selectable<AuthMode>[] = [
	{ label: "Root", value: "root" },
	{ label: "Namespace", value: "namespace" },
	{ label: "Database", value: "database" },
	{ label: "Record Access", value: "access" },
	{ label: "Token", value: "token" },
	{ label: "Anonymous", value: "none" },
	{ label: "Scope (Legacy)", value: "scope" },
];

export const CODE_LANGUAGES: Selectable<CodeLang>[] = [
	{ label: "CLI", value: "cli" },
	{ label: "Rust", value: "rust" },
	{ label: "JavaScript", value: "js" },
	// { label: "Go", value: "go" },
	{ label: "Python", value: "py" },
	{ label: ".NET", value: "csharp" },
	// { label: "Java", value: "java" },
	{ label: "PHP", value: "php" },
];

export const SIDEBAR_MODES: Selectable<SidebarMode>[] = [
	{ label: "Expandable", value: "expandable" },
	{ label: "Compact", value: "compact" },
	{ label: "Wide", value: "wide" },
];

export const VIEW_MODES: Record<ViewMode, ViewInfo> = {
	cloud: {
		id: "cloud",
		name: "Surreal Cloud",
		icon: iconCloud,
		desc: "Manage your Surreal Cloud environment",
		disabled: (flags) => !flags.cloud_view,
	},
	query: {
		id: "query",
		name: "Query",
		icon: iconQuery,
		anim: import("~/assets/animation/query.json").then((x) => x.default),
		desc: "Execute queries against the database and inspect the results",
		disabled: (flags) => !flags.query_view,
	},
	explorer: {
		id: "explorer",
		name: "Explorer",
		icon: iconExplorer,
		anim: import("~/assets/animation/explorer.json").then((x) => x.default),
		desc: "Explore the database tables, records, and relations",
		require: "database",
		disabled: (flags) => !flags.explorer_view,
	},
	graphql: {
		id: "graphql",
		name: "GraphQL",
		icon: iconGraphql,
		desc: "Execute GraphQL queries against the database",
		require: "database",
		disabled: (flags) => !flags.graphql_view,
	},
	designer: {
		id: "designer",
		name: "Designer",
		icon: iconDesigner,
		anim: import("~/assets/animation/designer.json").then((x) => x.default),
		desc: "Define database tables and relations",
		require: "database",
		disabled: (flags) => !flags.designer_view,
	},
	authentication: {
		id: "authentication",
		name: "Authentication",
		icon: iconAuth,
		anim: import("~/assets/animation/auth.json").then((x) => x.default),
		desc: "Manage system users and access methods",
		disabled: (flags) => !flags.auth_view,
	},
	functions: {
		id: "functions",
		name: "Functions",
		icon: iconFunction,
		desc: "Create and update schema level functions",
		require: "database",
		disabled: (flags) => !flags.functions_view,
	},
	models: {
		id: "models",
		name: "Models",
		icon: iconModuleML,
		desc: "Upload and manage machine learning models",
		require: "database",
		disabled: (flags) => !flags.models_view,
	},
	documentation: {
		id: "documentation",
		name: "API Docs",
		icon: iconAPI,
		desc: "View the database schema and documentation",
		require: "database",
		disabled: (flags) => !flags.apidocs_view,
	},
};

export const CLOUD_PAGES: Record<CloudPage, CloudPageInfo> = {
	instances: {
		id: "instances",
		name: "Instances",
		icon: iconServer,
	},
	members: {
		id: "members",
		name: "Members",
		icon: iconAccount,
	},
	data: {
		id: "data",
		name: "Data Containers",
		icon: iconPackageClosed,
	},
	audits: {
		id: "audits",
		name: "Audit Log",
		icon: iconProgressClock,
	},
	billing: {
		id: "billing",
		name: "Billing",
		icon: iconCreditCard,
	},
	support: {
		id: "support",
		name: "Support",
		icon: iconEmail,
	},
	settings: {
		id: "settings",
		name: "Settings",
		icon: iconCog,
	},
	provision: {
		id: "provision",
		name: "Provision instance",
		icon: iconPlus,
	},
};

export const EXPORT_TYPES = ["tables", "analyzers", "functions", "params", "access"] as const;

export const SURREAL_KINDS = [
	{ label: "No kind specified", value: "" },
	{ label: "Any", value: "any" },
	{ label: "Array", value: "array" },
	{ label: "Bool", value: "bool" },
	{ label: "Datetime", value: "datetime" },
	{ label: "Decimal", value: "decimal" },
	{ label: "Duration", value: "duration" },
	{ label: "Float", value: "float" },
	{ label: "Int", value: "int" },
	{ label: "Number", value: "number" },
	{ label: "Object", value: "object" },
	{ label: "String", value: "string" },
	{ label: "Record", value: "record" },
	{ label: "Geometry", value: "geometry" },
];

export const GEOMETRY_TYPES = [
	{ label: "Feature", value: "feature" },
	{ label: "Point", value: "point" },
	{ label: "Line", value: "line" },
	{ label: "Polygon", value: "polygon" },
	{ label: "MultiPoint", value: "multipoint" },
	{ label: "MultiLine", value: "multiline" },
	{ label: "MultiPolygon", value: "multipolygon" },
	{ label: "Collection", value: "collection" },
];

export const DESIGNER_NODE_MODES: Selection<DiagramMode> = [
	{ label: "Fields", value: "fields" },
	{ label: "Summary", value: "summary" },
	{ label: "Simple", value: "simple" },
];

export const DESIGNER_DIRECTIONS: Selection<DiagramDirection> = [
	{ label: "Left to right", value: "ltr" },
	{ label: "Right to left", value: "rtl" },
];

export const SURQL_FILTER = {
	name: "SurrealDB Schema",
	extensions: ["surql", "sql", "surrealql"],
};

export const ORIENTATIONS: Selectable<Orientation>[] = [
	{ label: "Horizontal", value: "horizontal" },
	{ label: "Vertical", value: "vertical" },
];

export const LINE_STYLES: Selectable<LineStyle>[] = [
	{ label: "Metro", value: "metro" },
	{ label: "Straight", value: "straight" },
	{ label: "Smooth", value: "smooth" },
];

export const SCHEMA_MODES: Selectable<SchemaMode>[] = [
	{ label: "Schemaless", value: "schemaless" },
	{ label: "Schemafull", value: "schemafull" },
];

export const REGION_FLAGS: Record<string, string> = {
	"aws-euw1": flagIE,
	"aws-use1": flagUS,
};

export const DRIVERS: Driver[] = [
	{
		id: "cli",
		name: "CLI",
		icon: SurrealIcon,
		link: "https://surrealdb.com/docs/surrealdb/cli",
	},
	{
		id: "rust",
		name: "Rust",
		icon: RustIcon,
		link: "https://surrealdb.com/docs/sdk/rust",
	},
	{
		id: "js",
		name: "JavaScript",
		icon: JavaScriptIcon,
		link: "https://surrealdb.com/docs/sdk/javascript",
	},
	{
		id: "go",
		name: "GoLang",
		icon: GoLangIcon,
		link: "https://surrealdb.com/docs/sdk/golang",
	},
	{
		id: "py",
		name: "Python",
		icon: PythonIcon,
		link: "https://surrealdb.com/docs/sdk/python",
	},
	{
		id: "csharp",
		name: ".NET",
		icon: DotNetIcon,
		link: "https://surrealdb.com/docs/sdk/dotnet",
	},
	{
		id: "java",
		name: "Java",
		icon: JavaIcon,
		link: "https://surrealdb.com/docs/sdk/java",
	},
	{
		id: "php",
		name: "PHP",
		icon: PhpIcon,
		link: "https://surrealdb.com/docs/sdk/php",
	},
];
