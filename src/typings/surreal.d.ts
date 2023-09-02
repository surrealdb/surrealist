/**
 * Database information pertaining to a SurrealDB instance
 */
export interface SurrealInfoKV {
	namespaces: Record<string, string>;
	users: Record<string, string>;
}

/**
 * Database information pertaining to a namespace
 */
export interface SurrealInfoNS {
	databases: Record<string, string>;
	tokens: Record<string, string>;
	users: Record<string, string>;
}

/**
 * Database information pertaining to a database
 */
export interface SurrealInfoDB {
	analyzers: Record<string, string>;
	functions: Record<string, string>;
	params: Record<string, string>;
	scopes: Record<string, string>;
	tables: Record<string, string>;
	tokens: Record<string, string>;
	users: Record<string, string>;
}

/**
 * Database information pertaining to a table
 */
export interface SurrealInfoTB {
	events: Record<string, string>;
	fields: Record<string, string>;
	indexes: Record<string, string>;
	tables: Record<string, string>;
}