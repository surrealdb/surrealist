import { SANDBOX } from "~/constants";
import { useDatabaseStore } from "~/stores/database";
import { useConnection } from "./connection";

const BASE_KINDS = [
	"any",
	"null",
	"bool",
	"bytes",
	"datetime",
	"decimal",
	"duration",
	"float",
	"int",
	"number",
	"object",
	"point",
	"string",
	"uuid",
	"function",
	"geometry<>",
	"option<>",
	"set<>",
	"array<>",
];

/**
 * Access the current root schema
 */
export function useRootSchema() {
	return useDatabaseStore((s) => s.connectionSchema.root);
}

/**
 * Access the current namespace schema
 */
export function useNamespaceSchema() {
	return useDatabaseStore((s) => s.connectionSchema.namespace);
}

/**
 * Access the current database schema
 */
export function useDatabaseSchema() {
	return useDatabaseStore((s) => s.connectionSchema.database);
}

/**
 * Fetch the schema tables based on the given filter
 *
 * @param mode The filter mode
 * @returns The filtered tables
 */
export function useTables() {
	const schema = useDatabaseSchema();

	if (!schema) {
		return [];
	}

	return schema.tables;
}

/**
 * Returns a list of table names
 *
 * @param mode The filter mode
 * @returns The table names
 */
export function useTableNames() {
	return useTables().map((t) => t.schema.name);
}

/**
 * Returns whether the current connection has schema access
 */
export function useHasSchemaAccess() {
	const [connectionId, authMode] = useConnection((c) => [
		c?.id,
		c?.authentication.mode ?? "none",
	]);

	// TODO Check token type

	return connectionId === SANDBOX || (authMode !== "none" && authMode !== "access");
}

/**
 * Returns a dynamic list of field kinds based
 * on the current schema.
 */
export function useKindList() {
	const tables = useTableNames();

	return [...BASE_KINDS, ...tables.map((t) => `record<${t}>`)];
}
