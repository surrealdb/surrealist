import { extract_event_definition, extract_field_definition, extract_index_definition, extract_scope_definition, extract_table_definition, extract_user_definition } from '../generated/surrealist-embed';
import { map } from "radash";
import { store } from "~/store";
import { IndexKind, ScopeDefinition, TableDefinition, TableEvent, TableField, TableIndex, TableSchema, UserDefinition } from "~/types";
import { SurrealInfoDB, SurrealInfoKV, SurrealInfoNS, SurrealInfoTB } from "~/typings/surreal";
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

	const [kvInfo, nsInfo, dbInfo] = await Promise.all([
		surreal.querySingle<SurrealInfoKV | null>("INFO FOR KV"),
		surreal.querySingle<SurrealInfoNS | null>("INFO FOR NS"),
		surreal.querySingle<SurrealInfoDB | null>("INFO FOR DB")
	]);

	// Fetch top level information
	const kvUsersMap = Object.values(kvInfo?.users ?? {});
	const nsUsersMap = Object.values(nsInfo?.users ?? {});
	const dbUsersMap = Object.values(dbInfo?.users ?? {});
	const dbScopesMap = Object.values(dbInfo?.scopes ?? {});
	const dbTablesMap = Object.values(dbInfo?.tables ?? {});

	const kvUsers: UserDefinition[] = await map(kvUsersMap, async (definition) => {
		return extract_user_definition(definition);
	});

	const nsUsers: UserDefinition[] = await map(nsUsersMap, async (definition) => {
		return extract_user_definition(definition);
	});

	const dbUsers: UserDefinition[] = await map(dbUsersMap, async (definition) => {
		return extract_user_definition(definition);
	});

	const scopes: ScopeDefinition[] = await map(dbScopesMap, async (definition) => {
		return extract_scope_definition(definition);
	});

	const tableInfo: TableSchema[] = await map(dbTablesMap, (definition) => {
		return extract_table_definition(definition);
	});

	// Fetch table information
	let tables: TableDefinition[] = [];

	if (tableInfo.length > 0) {
		const tableQuery = tableInfo.reduce((acc, table) => {
			return acc + `INFO FOR TABLE ${table.name};`;
		}, "");
	
		const tableData = await surreal.queryFirst(tableQuery);
	
		tables = await map(tableInfo, async (table, index) => {
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
	}

	store.dispatch(setDatabaseSchema({
		tables,
		scopes,
		kvUsers,
		nsUsers,
		dbUsers,
	}));
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