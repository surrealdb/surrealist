import { mdiLightningBolt, mdiTable, mdiLockOpen, mdiChartBoxOutline, mdiWrench } from "@mdi/js";

export type StructureTab = "graph" | "builder";

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
		desktop: false,
	},
	{
		id: "explorer",
		name: "Explorer",
		icon: mdiTable,
		desc: "Explore the database tables, records, and relations",
		desktop: false,
	},
	{
		id: "designer",
		name: "Designer",
		icon: mdiWrench,
		desc: "Define the database schemas and relations",
		desktop: true,
	},
	{
		id: "auth",
		name: "Authentication",
		icon: mdiLockOpen,
		desc: "Manage account details and database scopes",
		desktop: true,
	},
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
