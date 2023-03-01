import { useStoreValue } from "~/store";

/**
 * Returns a list of table names
 * 
 * @returns The table names
 */
export function useTableNames() {
	return useStoreValue(state => state.databaseSchema).map(t => t.schema.name);
}