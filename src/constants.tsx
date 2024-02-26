import { Protocol, ResultMode, Selectable } from "./types";
import { iconAuth, iconCombined, iconDataTable, iconDesigner, iconExplorer, iconJSON, iconLive, iconQuery } from "./util/icons";

export type StructureTab = "graph" | "builder";
export type ExportType = typeof EXPORT_TYPES[number];

export interface ListingItem {
	label: string;
	value: ResultMode;
	icon: string;
}

export const SANDBOX = "sandbox";
export const MAX_HISTORY_SIZE = 50;
export const MAX_LIVE_MESSAGES = 50;

export const THEMES = [
	{ label: "Automatic", value: "auto" },
	{ label: "Light", value: "light" },
	{ label: "Dark", value: "dark" },
];

export const RESULT_MODES: ListingItem[] = [
	{ label: "Combined", value: "combined", icon: iconCombined },
	{ label: "JSON", value: "single", icon: iconJSON },
	{ label: "Table", value: "table", icon: iconDataTable },
	{ label: "Live", value: "live", icon: iconLive },
];

export const CONNECTION_PROTOCOLS: Selectable<Protocol>[] = [
	{ label: "HTTP", value: "http" },
	{ label: "HTTPS", value: "https" },
	{ label: "WS", value: "ws" },
	{ label: "WSS", value: "wss" },
	{ label: "Memory", value: "mem" },
	{ label: "IndexedDB", value: "indxdb" },
];

export const AUTH_MODES = [
	{ label: "Root authentication", value: "root" },
	{ label: "Namespace authentication", value: "namespace" },
	{ label: "Database authentication", value: "database" },
	{ label: "Scope authentication", value: "scope" },
	{ label: "Anonymous", value: "none" },
];

export const VIEW_MODES = [
	{
		id: "query",
		name: "Query",
		icon: iconQuery,
		desc: "Execute queries against the database and inspect the results",
	},
	{
		id: "explorer",
		name: "Explorer",
		icon: iconExplorer,
		desc: "Explore the database tables, records, and relations",
	},
	{
		id: "designer",
		name: "Designer",
		icon: iconDesigner,
		desc: "Define database tables and relations",
	},
	{
		id: "authentication",
		name: "Authentication",
		icon: iconAuth,
		desc: "Manage account details and database scopes",
	},
] as const;

export const EXPORT_TYPES = [
	"records",
	"tables",
	"analyzers",
	"functions",
	"params",
	"scopes"
] as const;

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

export const DESIGNER_NODE_MODES = [
	{ label: "Fields", value: "fields" },
	{ label: "Summary", value: "summary" },
	{ label: "Simple", value: "simple" },
];

export const DESIGNER_DIRECTIONS = [
	{ label: "Left to right", value: "ltr" },
	{ label: "Right to left", value: "rtl" },
];

export const INDEX_TYPES = [
	{ label: "Normal", value: "normal" },
	{ label: "Unique", value: "unique" },
	{ label: "Search", value: "search" },
	// { label: "Vector", value: "vector" },
];

export const SURQL_FILTERS = [
	{
		name: "SurrealDB Schema",
		extensions: ["surql", "sql", "surrealql"],
	},
];