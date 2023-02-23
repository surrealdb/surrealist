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
		const result = await invoke('extract_table_fields', { definition });

		return result as Table;
	});

	store.dispatch(actions.setTables(tableInfo));
}