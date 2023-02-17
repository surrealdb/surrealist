import { mdiLightningBolt, mdiTable, mdiAdjust, mdiBrush, mdiLock, mdiLockOpen } from "@mdi/js";
import { ViewMode } from "./typings";

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
		desc: 'Execute queries against the database and inspect the results'
	},
	{
		id: 'explorer',
		name: 'Explorer',
		icon: mdiTable,
		desc: 'Explore the database tables, records, and relations'
	},
	{
		id: 'visualizer',
		name: 'Visualizer',
		icon: mdiAdjust,
		desc: 'Plot your database into an interactive graph visualization'
	},
	{
		id: 'designer',
		name: 'Designer',
		icon: mdiBrush,
		desc: 'Define the database schemas and relations'
	},
	{
		id: 'auth',
		name: 'Authentication',
		icon: mdiLockOpen,
		desc: 'Manage account details and database scopes'
	}
];