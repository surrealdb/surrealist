import { useStoreValue } from "~/store";
import { isEdgeTable } from "~/util/schema";
import { useActiveTab } from "./environment";

type TableMode = 'ALL' | 'TABLE' | 'EDGE';

/**
 * Fetch the schema tables based on the given filter
 * 
 * @param mode The filter mode
 * @returns The filtered tables
 */
export function useTables(mode: TableMode = 'ALL') {
	return useStoreValue(state => state.databaseSchema).filter(t => {
		if (mode == 'ALL') return true;
		if (mode == 'TABLE') return !isEdgeTable(t);
		if (mode == 'EDGE') return isEdgeTable(t);
		return false;
	});
}

/**
 * Returns a list of table names
 * 
 * @param mode The filter mode
 * @returns The table names
 */
export function useTableNames(mode: TableMode = 'ALL') {
	return useTables(mode).map(t => t.schema.name);
}

/**
 * Returns whether the current connection has schema access
 */
export function useHasSchemaAccess() {
	const authMode = useActiveTab()?.connection?.authMode || 'none';

	return authMode != 'none' && authMode != 'scope';
}