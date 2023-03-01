import { invoke } from "@tauri-apps/api";
import { map } from "radash";
import { actions, store } from "~/store";
import { getActiveSurreal } from "~/surreal";
import { TableSchema, TableEvent, TableField, TableIndex, TableDefinition } from "~/typings";

/**
 * Fetch information about a table schema
 * 
 * @param table The table to query
 * @returns Schema information
 */
export async function fetchDatabaseSchema() {
	const surreal = getActiveSurreal();
	const dbResponse = await surreal.query('INFO FOR DB');
	const dbResult = dbResponse[0].result;

	if (!dbResult) {
		return [];
	}

	const databaseInfo = await map(Object.values(dbResult.tb), definition => {
		return invoke<TableSchema>('extract_table_definition', { definition });
	});

	const tables = await map(databaseInfo, (async table => {
		const tbResponse = await surreal.query(`INFO FOR TABLE ${table.name}`);
		const tableInfo = tbResponse[0].result;

		const fieldInfo = await map(Object.values(tableInfo.fd), definition => {
			return invoke<TableField>('extract_field_definition', { definition });
		});

		const indexInfo = await map(Object.values(tableInfo.ix), definition => {
			return invoke<TableIndex>('extract_index_definition', { definition });
		});

		const eventInfo = await map(Object.values(tableInfo.ev), definition => {
			return invoke<TableEvent>('extract_event_definition', { definition });
		});

		const mappedFields = fieldInfo.map(field => {
			let kind = field.kind;
			let kindTables: string[] = [];
			let kindGeometry: string[] = [];

			if (field.kind.startsWith('record')) {
				kindTables = field.kind.replace('record(', '').replace(')', '').split(',');
				kind = 'record';
			}

			if (field.kind.startsWith('geometry')) {
				kindGeometry = field.kind.replace('geometry(', '').replace(')', '').split(',');
				kind = 'geometry';
			}

			return {
				...field,
				kind,
				kindGeometry,
				kindTables
			};
		});

		return {
			schema: table,
			fields: mappedFields,
			indexes: indexInfo,
			events: eventInfo
		};
	}));

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