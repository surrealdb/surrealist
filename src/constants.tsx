import { mdiLightningBolt, mdiTable, mdiLockOpen, mdiChartBoxOutline, mdiWrench } from "@mdi/js";

export type StructureTab = "graph" | "builder";
export type ExportType = typeof EXPORT_TYPES[number];

export const EXPORT_TYPES = [
	"data",
	"tables",
	"analyzers",
	"functions",
	"params",
	"scopes"
] as const;

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
		icon: mdiLightningBolt,
		desc: "Execute queries against the database and inspect the results",
	},
	{
		id: "explorer",
		name: "Explorer",
		icon: mdiTable,
		desc: "Explore the database tables, records, and relations",
	},
	{
		id: "designer",
		name: "Designer",
		icon: mdiWrench,
		desc: "Define database tables and relations",
	},
	{
		id: "auth",
		name: "Authentication",
		icon: mdiLockOpen,
		desc: "Manage account details and database scopes",
	},
	// {
	// 	id: "live",
	// 	name: "Live Queries",
	// 	icon: mdiBroadcast,
	// 	desc: "Subscribe and receive live updates from the database",
	// 	desktop: true,
	// },
] as const;

export const STRUCTURE_TABS = [
	{
		id: "builder",
		name: "Builder",
		icon: mdiTable,
	},
	{
		id: "graph",
		name: "Visualizer",
		icon: mdiChartBoxOutline,
	},
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

export const DESIGNER_LAYOUT_MODES = [
	{ label: "Diagram", value: "diagram" },
	{ label: "Grid", value: "grid" },
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