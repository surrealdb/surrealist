import { extract_event_definition, extract_field_definition, extract_index_definition, extract_table_definition } from '../generated/surrealist-embed';
import { map } from "radash";
import { store } from "~/store";
import { IndexKind, TableDefinition, TableEvent, TableField, TableIndex, TableSchema } from "~/types";
import { SurrealInfoDB, SurrealInfoTB } from "~/typings/surreal";
import { getActiveSurreal } from "./connection";
import { extractTypeList } from './helpers';
import { setDatabaseSchema } from '~/stores/database';

/**
 * Fetch information about a table schema
 *
 * @param table The table to query
 * @returns Schema information
 */
export async function fetchDatabaseSchema() {
	const surreal = getActiveSurreal();
	const dbResponse = await surreal.querySingle("INFO FOR DB");
	const dbResult = dbResponse[0].result as SurrealInfoDB;

	if (!dbResult) {
		return [];
	}

	const databaseInfo: TableSchema[] = await map(Object.values(dbResult.tables), (definition) => {
		return extract_table_definition(definition);
	});

	const tableQuery = databaseInfo.reduce((acc, table) => {
		return acc + `INFO FOR TABLE ${table.name};`;
	}, "");

	if (!tableQuery) {
		return [];
	}

	const tableData = await surreal.querySingle(tableQuery);

	const tables = await map(databaseInfo, async (table, index) => {
		const tableInfo = tableData[index].result as SurrealInfoTB;

		const fieldInfo: TableField[] = await map(Object.values(tableInfo.fields), (definition) => {
			return extract_field_definition(definition);
		});

		const indexInfo: TableIndex[] = await map(Object.values(tableInfo.indexes), (definition) => {
			return extract_index_definition(definition);
		});

		const eventInfo: TableEvent[] = await map(Object.values(tableInfo.events), (definition) => {
			return extract_event_definition(definition);
		});

		const mappedFields = fieldInfo.map((field) => {
			let kindTables: string[] = [];

			if (field.kind.startsWith("record")) {
				kindTables = extractTypeList(field.kind, "record");
			}

			return {
				...field,
				kindTables,
			};
		});

		const mappedIndexes = indexInfo.map((index) => {
			return {
				...index,
				kind: index.kind.toLowerCase() as IndexKind,
				search: index.search.replace('SEARCH ANALYZER ', ''),
				vector: index.vector.replace('MTREE DIMENSION ', ''),
			};
		});

		return {
			schema: {
				...table,
				changetime: table.changetime.replace('CHANGEFEED ', ''),
			},
			fields: mappedFields,
			indexes: mappedIndexes,
			events: eventInfo,
		};
	});

	store.dispatch(setDatabaseSchema(tables));

	return tables;
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
		if (f.name == "in") {
			inRecords = f.kindTables;
			hasIn = true;
		} else if (f.name == "out") {
			outRecords = f.kindTables;
			hasOut = true;
		}
	}

	return [hasIn && hasOut, inRecords, outRecords];
}

/**
 * Returns true if the table is an edge table
 *
 * @param table The table to check
 * @returns True if the table is an edge table
 */
export function isEdgeTable(table: TableDefinition) {
	return extractEdgeRecords(table)[0];
}