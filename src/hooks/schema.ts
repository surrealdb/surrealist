import { useStoreValue } from "~/store";
import { useActiveTab } from "./tab";

/**
 * Returns a list of table names
 * 
 * @returns The table names
 */
export function useTableNames() {
	return useStoreValue(state => state.databaseSchema).map(t => t.schema.name);
}

/**
 * Returns whether the current connection has schema access
 */
export function useHasSchemaAccess() {
	const authMode = useActiveTab()?.connection?.authMode || 'none';

	return authMode != 'none' && authMode != 'scope';
}