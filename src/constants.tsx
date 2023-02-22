import { mdiLightningBolt, mdiTable, mdiBrush, mdiLockOpen, mdiChartArc, mdiViewColumn, mdiEye, mdiChartBubble, mdiCodeJson, mdiBookshelf, mdiLandRowsHorizontal } from "@mdi/js";
import { adapter } from "./adapter";
import { DesktopAdapter } from "./adapter/desktop";

export type StructureTab = 'graph' | 'schema' | 'fields' | 'indexes' | 'events';

export const AUTH_MODES = [
	{ label: 'Root authentication', value: 'root' },
	{ label: 'Namespace authentication', value: 'namespace' },
	{ label: 'Database authentication', value: 'database' },
	{ label: 'Scope authentication', value: 'scope' },
	{ label: 'Anonymous', value: 'none' }
];

export const VIEW_MODES = [
	{
		id: 'query',
		name: 'Query',
		icon: mdiLightningBolt,
		desc: 'Execute queries against the database and inspect the results',
		desktop: false
	},
	{
		id: 'explorer',
		name: 'Explorer',
		icon: mdiTable,
		desc: 'Explore the database tables, records, and relations',
		desktop: false
	},
	// {
	// 	id: 'visualizer',
	// 	name: 'Visualizer',
	// 	icon: mdiAdjust,
	// 	desc: 'Plot your database into an interactive graph visualization'
	// },
	{
		id: 'designer',
		name: 'Designer',
		icon: mdiBrush,
		desc: 'Define the database schemas and relations',
		desktop: true
	},
	{
		id: 'auth',
		name: 'Authentication',
		icon: mdiLockOpen,
		desc: 'Manage account details and database scopes',
		desktop: true
	}
] as const;

export const STRUCTURE_TABS = [
	{
		id: 'schema',
		name: 'Schema',
		icon: mdiTable,
	},
	{
		id: 'fields',
		name: 'Fields',
		icon: mdiLandRowsHorizontal,
	},
	{
		id: 'indexes',
		name: 'Indexes',
		icon: mdiBookshelf,
	},
	{
		id: 'events',
		name: 'Events',
		icon: mdiLightningBolt,
	}
] as const;