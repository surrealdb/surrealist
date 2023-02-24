import { invoke } from "@tauri-apps/api";
import { map } from "radash";
import { actions, store } from "~/store";
import { getActiveSurreal } from "~/surreal";
import { Table } from "~/typings";

/**
 * Update the tables and cache them in the store
 */
export async function fetchTables() {
	const surreal = getActiveSurreal();

	const response = await surreal.query('INFO FOR DB');
	const tableMap = response[0].result.tb;

	const tableInfo = await map(Object.values(tableMap), async definition => {
		const result = await invoke('extract_table_definition', { definition });

		return result as Table;
	});

	store.dispatch(actions.setTables(tableInfo));
}

/**
 * Fetch information about a table schema
 * 
 * @param table The table to query
 * @returns Schema information
 */
export async function fetchTableSchema(table: Table) {
	const surreal = getActiveSurreal();

	const response = await surreal.query(`INFO FOR TABLE ${table.name}`);
	const tableInfo = response[0].result;

	const fieldInfo = await map(Object.values(tableInfo.fd), definition => {
		return invoke('extract_field_definition', { definition });
	});

	const indexInfo = await map(Object.values(tableInfo.ix), definition => {
		return invoke('extract_index_definition', { definition });
	});

	const eventInfo = await map(Object.values(tableInfo.ev), definition => {
		return invoke('extract_event_definition', { definition });
	});

	return {
		fields: fieldInfo,
		indexes: indexInfo,
		events: eventInfo
	}
}