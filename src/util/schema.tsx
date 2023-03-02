import { adapter } from "~/adapter";
import { actions, store } from "~/store";
import { TableDefinition } from "~/typings";

/**
 * Fetch information about a table schema
 * 
 * @param table The table to query
 * @returns Schema information
 */
export async function fetchDatabaseSchema() {
	const tables = await adapter.fetchSchema();

	store.dispatch(actions.setDatabaseSchema(tables));

	return tables
}

/**
 * Returns true if the table is an edge table
 * 
 * @param table The table to check
 * @returns True if the table is an edge table
 */
export function extractEdgeRecords(table: TableDefinition): [boolean, string[], string[]] {
	let hasIn = false;
	let hasOut = false;
	let inRecords: string[] = [];
	let outRecords: string[] = [];

	for (const f of table.fields) {
		if (f.name == 'in') {
			inRecords = f.kindTables;
			hasIn = true;
		} else if (f.name == 'out') {
			outRecords = f.kindTables;
			hasOut = true;
		}
	}

	return [hasIn && hasOut, inRecords, outRecords];
}