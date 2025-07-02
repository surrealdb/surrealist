import flagIE from "flag-icons/flags/4x3/ie.svg";
import flagUS from "flag-icons/flags/4x3/us.svg";

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

import type {
	AuthMode,
	Dataset,
	DiagramAlgorithm,
	DiagramDirection,
	DiagramLineStyle,
	DiagramLinks,
	DiagramMode,
	Driver,
	GlobalPage,
	GlobalPageInfo,
	Listable,
	Orientation,
	Protocol,
	ResultFormat,
	ResultMode,
	ScaleStep,
	SchemaMode,
	Selectable,
	SidebarMode,
	SyntaxTheme,
	TableVariant,
	ViewPage,
	ViewPageInfo,
} from "./types";

import {
	iconAPI,
	iconAuth,
	iconBraces,
	iconCombined,
	iconDataTable,
	iconDatabase,
	iconDesigner,
	iconExplorer,
	iconFunction,
	iconGraphql,
	iconHelp,
	iconLive,
	iconModuleML,
	iconOrganization,
	iconQuery,
	iconReferral,
	iconRelation,
	iconSearch,
	iconSidekick,
	iconTable,
	iconTune,
	iconXml,
} from "./util/icons";

import type { MantineColorScheme } from "@mantine/core";

export type StructureTab = "graph" | "builder";
export type ProtocolOption = Selectable<Protocol> & { remote: boolean };

export const SANDBOX = "sandbox";
export const MAX_HISTORY_SIZE = 50;
export const MAX_HISTORY_QUERY_LENGTH = 7500;
export const MAX_LIVE_MESSAGES = 50;
export const INSTANCE_CONFIG = "instance.json";
export const SENSITIVE_ACCESS_FIELDS = new Set(["password", "pass", "secret"]);
export const ML_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);
export const GQL_SUPPORTED = new Set<Protocol>(["ws", "wss", "http", "https"]);
export const CLOUD_ROLES = ["member", "admin", "owner"];

export const DATASETS: Record<string, Dataset> = {
	"surreal-deal-store": {
		name: "Surreal Deal Store",
		path: "/surreal-deal-store-mini.surql",
	},
};

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
	"/chat": {
		id: "/chat",
		name: "Sidekick",
		icon: iconSidekick,
		disabled: ({ flags }) => !flags.cloud_enabled,
	},
	"/referrals": {
		id: "/referrals",
		name: "Referrals",
		icon: iconReferral,
		disabled: ({ flags }) => !flags.cloud_enabled,
	},
	"/support": {
		id: "/support",
		name: "Support",
		icon: iconHelp,
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
		disabled: ({ flags, isCloud }) => !flags.query_view || !isCloud,
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
	functions: {
		id: "functions",
		name: "Functions",
		icon: iconFunction,
		disabled: ({ flags }) => !flags.functions_view,
	},
	models: {
		id: "models",
		name: "Models",
		icon: iconModuleML,
		disabled: ({ flags }) => !flags.models_view,
	},
	sidekick: {
		id: "sidekick",
		name: "Sidekick",
		icon: iconSidekick,
		disabled: ({ flags }) => !flags.sidekick_view,
	},
	documentation: {
		id: "documentation",
		name: "API Docs",
		icon: iconAPI,
		disabled: ({ flags }) => !flags.apidocs_view,
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

export const SCHEMA_MODES: Selectable<SchemaMode>[] = [
	{ label: "Schemaless", value: "schemaless" },
	{ label: "Schemafull", value: "schemafull" },
];

export const REGION_FLAGS: Record<string, string> = {
	"aws-euw1": flagIE,
	"aws-use1": flagUS,
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
