import { invoke } from "@tauri-apps/api";
import { map } from "radash";
import { actions, store } from "~/store";
import { getActiveSurreal } from "~/surreal";
import { TableSchema, TableEvent, TableField, TableIndex } from "~/typings";

/**
 * Fetch information about a table schema
 * 
 * @param table The table to query
 * @returns Schema information
 */
export async function fetchDatabaseSchema() {
	const surreal = getActiveSurreal();

	const dbResponse = await surreal.query('INFO FOR DB');
	const tableMap = dbResponse[0].result.tb;

	const databaseInfo = await map(Object.values(tableMap), definition => {
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

		return {
			schema: table,
			fields: fieldInfo,
			indexes: indexInfo,
			events: eventInfo
		};
	}));

	store.dispatch(actions.setDatabaseSchema(tables));

	return tables
}