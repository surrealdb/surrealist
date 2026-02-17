import type { MantineColor, MantineColorScheme } from "@mantine/core";
import {
	iconAPI,
	iconAuth,
	iconBraces,
	iconChart,
	iconChat,
	iconChevronUp,
	iconCombined,
	iconDatabase,
	iconDataTable,
	iconDesigner,
	iconErrorCircle,
	iconExplorer,
	iconEye,
	iconEyeOff,
	iconFunction,
	iconGraphql,
	iconHelp,
	iconLive,
	iconOrganization,
	iconQuery,
	iconReferral,
	iconRelation,
	iconSearch,
	iconTable,
	iconTag,
	iconTransfer,
	iconTune,
	iconVariable,
	iconWarning,
	iconXml,
} from "@surrealdb/ui";
import { satisfies } from "compare-versions";
import flagIE from "flag-icons/flags/4x3/ie.svg";
import flagIN from "flag-icons/flags/4x3/in.svg";
import flagUS from "flag-icons/flags/4x3/us.svg";
import type {
	AuthMode,
	DiagramAlgorithm,
	DiagramDirection,
	DiagramHoverFocus,
	DiagramLineStyle,
	DiagramLinks,
	DiagramMode,
	DiagramStrategy,
	Driver,
	GlobalPage,
	GlobalPageInfo,
	Listable,
	Monitor,
	MonitorSeverity,
	NoneResultMode,
	Orientation,
	Protocol,
	ResultFormat,
	ResultMode,
	ScaleStep,
	SchemaMode,
	Selectable,
	SidebarMode,
	SupportRequestType,
	SyntaxTheme,
	TableVariant,
	ViewPage,
	ViewPageInfo,
} from "./types";
import {
	CIcon,
	DotNetIcon,
	GoLangIcon,
	JavaIcon,
	JavaScriptIcon,
	PhpIcon,
	PythonIcon,
	RustIcon,
	SurrealIcon,
} from "./util/drivers";

export type StructureTab = "graph" | "builder";
export type ProtocolOption = Selectable<Protocol> & { remote: boolean };

export const SANDBOX = "sandbox";
export const MAX_HISTORY_SIZE = 50;
export const MAX_HISTORY_QUERY_LENGTH = 7500;
export const MAX_LIVE_MESSAGES = 50;
export const SALES_ENQUIRY_TAG = "11403616";
export const INSTANCE_CONFIG = "instance.json";
export const SENSITIVE_ACCESS_FIELDS = new Set(["password", "pass", "secret"]);
export const ML_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);
export const GQL_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);
export const CLOUD_ROLES = [
	"restricted_member",
	"member",
	"restricted_support_member",
	"support_member",
	"restricted_admin",
	"admin",
	"restricted_owner",
	"owner",
];

export const SCALE_STEPS: Selectable<ScaleStep>[] = [
	{ label: "125%", value: "125" },
	{ label: "110%", value: "110" },
	{ label: "100%", value: "100" },
	{ label: "90%", value: "90" },
	{ label: "75%", value: "75" },
];

export const THEMES: Selectable<MantineColorScheme>[] = [
	{ label: "Automatic", value: "auto" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export const SYNTAX_THEMES: Selectable<SyntaxTheme>[] = [
	{ label: "Default", value: "default" },
	{ label: "Vivid", value: "vivid" },
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
		label: "Graph",
		value: "graph",
		icon: iconRelation,
		description: "Visualize query results in a graph",
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

export const SUPPORT_REQUEST_TYPES: Listable<SupportRequestType>[] = [
	{
		label: "Conversation",
		value: "conversation",
		icon: iconChat,
		description: "Raise a sales or billing question",
	},
	{
		label: "Ticket",
		value: "ticket",
		icon: iconTag,
		description: "Request expedited support",
	},
];

export const NONE_RESULT_MODES: Listable<NoneResultMode>[] = [
	{
		label: "Show",
		value: "show",
		icon: iconEye,
		description: "Show NONE results",
	},
	{
		label: "Hide",
		value: "hide",
		icon: iconEyeOff,
		description: "Hide NONE results",
	},
	{
		label: "Collapse",
		value: "collapse",
		icon: iconChevronUp,
		description: "Collapse NONE results",
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
];

export const SIDEBAR_MODES: Selectable<SidebarMode>[] = [
	{ label: "Expandable", value: "expandable" },
	{ label: "Compact", value: "compact" },
	{ label: "Wide", value: "wide" },
];

export const GLOBAL_PAGES: Record<GlobalPage, GlobalPageInfo> = {
	"/overview": {
		id: "/overview",
		name: "Overview",
		icon: iconExplorer,
	},
	"/signin": {
		id: "/signin",
		name: "Authenticate",
		icon: iconAuth,
	},
	"/organisations": {
		id: "/organisations",
		name: "Organisations",
		icon: iconOrganization,
		aliases: ["/o/*"],
		disabled: ({ flags }) => !flags.cloud_enabled,
	},
	"/referrals": {
		id: "/referrals",
		name: "Referrals",
		icon: iconReferral,
		disabled: ({ flags }) => !flags.cloud_enabled,
	},
	"/mini/new": {
		id: "/mini/new",
		name: "Embed Surrealist",
		icon: iconXml,
	},
};

export const VIEW_PAGES: Record<ViewPage, ViewPageInfo> = {
	dashboard: {
		id: "dashboard",
		name: "Dashboard",
		icon: iconTune,
		disabled: ({ isCloud }) => !isCloud,
	},
	monitor: {
		id: "monitor",
		name: "Monitoring",
		icon: iconChart,
		disabled: ({ isCloud }) => !isCloud,
	},
	query: {
		id: "query",
		name: "Query",
		icon: iconQuery,
		anim: import("~/assets/animation/query.json").then((x) => x.default),
		disabled: ({ flags }) => !flags.query_view,
	},
	explorer: {
		id: "explorer",
		name: "Explorer",
		icon: iconExplorer,
		anim: import("~/assets/animation/explorer.json").then((x) => x.default),
		disabled: ({ flags }) => !flags.explorer_view,
	},
	graphql: {
		id: "graphql",
		name: "GraphQL",
		icon: iconGraphql,
		disabled: ({ flags }) => !flags.graphql_view,
	},
	designer: {
		id: "designer",
		name: "Designer",
		icon: iconDesigner,
		anim: import("~/assets/animation/designer.json").then((x) => x.default),
		disabled: ({ flags }) => !flags.designer_view,
	},
	authentication: {
		id: "authentication",
		name: "Authentication",
		icon: iconAuth,
		anim: import("~/assets/animation/auth.json").then((x) => x.default),
		disabled: ({ flags }) => !flags.auth_view,
	},
	parameters: {
		id: "parameters",
		name: "Parameters",
		icon: iconVariable,
		disabled: ({ flags }) => !flags.parameters_view,
	},
	functions: {
		id: "functions",
		name: "Functions",
		icon: iconFunction,
		disabled: ({ flags }) => !flags.functions_view,
	},
	documentation: {
		id: "documentation",
		name: "API Docs",
		icon: iconAPI,
		disabled: ({ flags }) => !flags.apidocs_view,
	},
	migrations: {
		id: "migrations",
		name: "3.0 Migration",
		icon: iconTransfer,
		disabled: ({ flags, version }) =>
			!flags.v3_migration_tooling || !version || !satisfies(version, ">=2.6.1 <3.0.0-0"),
	},
};

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

export const DESIGNER_NODE_MODES: Selectable<DiagramMode>[] = [
	{ label: "Default", value: "default" },
	{ label: "Fields", value: "fields" },
	{ label: "Summary", value: "summary" },
	{ label: "Simple", value: "simple" },
];

export const DESIGNER_DIRECTIONS: Selectable<DiagramDirection>[] = [
	{ label: "Default", value: "default" },
	{ label: "Left to right", value: "ltr" },
	{ label: "Right to left", value: "rtl" },
];

export const DESIGNER_STRATEGIES: Selectable<DiagramStrategy>[] = [
	{ label: "Network Simplex", value: "NETWORK_SIMPLEX" },
	{ label: "Brandes Koepf", value: "BRANDES_KOEPF" },
	{ label: "Linear Segments", value: "LINEAR_SEGMENTS" },
];

export const DESIGNER_LINKS: Selectable<DiagramLinks>[] = [
	{ label: "Default", value: "default" },
	{ label: "Hide record links", value: "hidden" },
	{ label: "Show record links", value: "visible" },
];

export const SURQL_FILTER = {
	name: "SurrealDB Schema",
	extensions: ["surql", "sql", "surrealql"],
};

export const JSON_FILTER = {
	name: "JSON File",
	extensions: ["json"],
};

export const CSV_FILTER = {
	name: "CSV File",
	extensions: ["csv"],
};

export const ORIENTATIONS: Selectable<Orientation>[] = [
	{ label: "Horizontal", value: "horizontal" },
	{ label: "Vertical", value: "vertical" },
];

export const DESIGNER_LINE_STYLES: Selectable<DiagramLineStyle>[] = [
	{ label: "Default", value: "default" },
	{ label: "Metro", value: "metro" },
	{ label: "Straight", value: "straight" },
	{ label: "Smooth", value: "smooth" },
];

export const DESIGNER_ALGORITHMS: Selectable<DiagramAlgorithm>[] = [
	{ label: "Default", value: "default" },
	{ label: "Aligned", value: "aligned" },
	{ label: "Spaced", value: "spaced" },
];

export const DESIGNER_HOVER_FOCUS: Selectable<DiagramHoverFocus>[] = [
	{ label: "Default", value: "default" },
	{ label: "None", value: "none" },
	{ label: "Neighbours", value: "neighbours" },
	{ label: "Chain", value: "chain" },
	{ label: "Recursive", value: "recursive" },
];

export const SCHEMA_MODES: Selectable<SchemaMode>[] = [
	{ label: "Schemaless", value: "schemaless" },
	{ label: "Schemafull", value: "schemafull" },
];

export const REGION_FLAGS: Record<string, string> = {
	"aws-euw1": flagIE,
	"aws-use1": flagUS,
	"aws-use2": flagUS,
	"aws-usw2": flagUS,
	"aws-aps1": flagIN,
};

export const TABLE_VARIANT_ICONS: Record<TableVariant, string> = {
	normal: iconTable,
	relation: iconRelation,
	view: iconSearch,
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
		id: "php",
		name: "PHP",
		icon: PhpIcon,
		link: "https://surrealdb.com/docs/sdk/php",
	},
	{
		id: "go",
		name: "GoLang",
		icon: GoLangIcon,
		link: "https://surrealdb.com/docs/sdk/golang",
	},
	{
		id: "java",
		name: "Java",
		icon: JavaIcon,
		link: "https://surrealdb.com/docs/sdk/java",
	},
	{
		id: "c",
		name: "C",
		icon: CIcon,
		link: "https://github.com/surrealdb/surrealdb.c",
	},
];

export const MONITORS: Record<string, Monitor> = {
	system: {
		id: "system",
		type: "metrics",
		name: "System",
	},
	connections: {
		id: "connections",
		type: "metrics",
		name: "Connections",
	},
	network: {
		id: "network",
		type: "metrics",
		name: "Network traffic",
	},
	surrealdb: {
		id: "surrealdb",
		type: "logs",
		name: "SurrealDB",
	},
};

export const MONITOR_LOG_LEVEL_INFO: Record<string, [string, MantineColor, MonitorSeverity]> = {
	INFO: [iconHelp, "violet", "info"],
	WARN: [iconWarning, "orange", "warning"],
	ERROR: [iconErrorCircle, "red", "error"],
	FATAL: [iconErrorCircle, "red", "error"],
};
