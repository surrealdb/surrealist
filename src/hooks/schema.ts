import { isEdgeTable } from "~/util/schema";
import { useDatabaseStore } from "~/stores/database";
import { useConnection } from "./connection";
import { SANDBOX } from "~/constants";

type TableMode = "ALL" | "TABLE" | "EDGE";

const BASE_KINDS = [
	'any',
	'null',
	'bool',
	'bytes',
	'datetime',
	'decimal',
	'duration',
	'float',
	'int',
	'number',
	'object',
	'point',
	'string',
	'uuid',
	'geometry<>',
	'option<>',
	'set<>',
	'array<>',
];

/**
 * Access the current database schema
 */
export function useSchema() {
	return useDatabaseStore((s) => s.databaseSchema);
}

/**
 * Fetch the schema tables based on the given filter
 *
 * @param mode The filter mode
 * @returns The filtered tables
 */
export function useTables(mode: TableMode = "ALL") {
	const schema = useSchema();

	if (!schema) {
		return [];
	}

	return schema.tables.filter((t) => {
		if (mode == "ALL") return true;
		if (mode == "TABLE") return !isEdgeTable(t);
		if (mode == "EDGE") return isEdgeTable(t);
		return false;
	});
}

/**
 * Returns a list of table names
 *
 * @param mode The filter mode
 * @returns The table names
 */
export function useTableNames(mode: TableMode = "ALL") {
	return useTables(mode).map((t) => t.schema.name);
}

/**
 * Returns whether the current connection has schema access
 */
export function useHasSchemaAccess() {
	const connection = useConnection();
	const authMode = connection?.connection?.authMode || "none";

	return connection?.id == SANDBOX || authMode != "none" && authMode != "scope";
}

/**
 * Returns a dynamic list of field kinds based
 * on the current schema.
 */
export function useKindList() {
	const tables = useTableNames();

	return [
		...BASE_KINDS,
		...tables.map(t => `record<${t}>`)
	];
}