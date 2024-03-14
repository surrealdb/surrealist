import { mdiBrain, mdiXml } from "@mdi/js";
import { Protocol, ResultMode, Selectable, ViewInfo, ViewMode } from "./types";
import { iconAuth, iconCombined, iconDataTable, iconDesigner, iconExplorer, iconLive, iconQuery } from "./util/icons";

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
	{ label: "Individual", value: "single", icon: iconQuery },
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

export const AUTH_MODES: Selectable<string>[] = [
	{ label: "Root authentication", value: "root" },
	{ label: "Namespace authentication", value: "namespace" },
	{ label: "Database authentication", value: "database" },
	{ label: "Scope authentication", value: "scope" },
	{ label: "Anonymous", value: "none" },
];

export const VIEW_MODES: Record<ViewMode, ViewInfo> = {
	query: {
		id: "query",
		name: "Query",
		icon: iconQuery,
		desc: "Execute queries against the database and inspect the results",
	},
	explorer: {
		id: "explorer",
		name: "Explorer",
		icon: iconExplorer,
		desc: "Explore the database tables, records, and relations",
	},
	designer: {
		id: "designer",
		name: "Designer",
		icon: iconDesigner,
		desc: "Define database tables and relations",
	},
	authentication: {
		id: "authentication",
		name: "Authentication",
		icon: iconAuth,
		desc: "Manage account details and database scopes",
	},
	models: {
		id: "models",
		name: "ML Models",
		icon: mdiBrain,
		desc: "Manage SurrealML models",
		disabled: (flags) => !flags.mlmodels,
	},
	documentation: {
		id: "documentation",
		name: "API Docs",
		icon: mdiXml,
		desc: "View the database schema and documentation",
		disabled: (flags) => !flags.apidocs,
	}
};

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