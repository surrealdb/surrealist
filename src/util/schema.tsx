import { extract_event_definition, extract_field_definition, extract_function_definition, extract_index_definition, extract_scope_definition, extract_table_definition, extract_user_definition } from '../generated/surrealist-embed';
import { FunctionDefinition, ModelDefinition, TableDefinition } from "~/types";
import { SurrealInfoDB, SurrealInfoKV, SurrealInfoNS, SurrealInfoTB } from "~/typings/surreal";
import { getActiveSurreal } from "./surreal";
import { printLog, tb } from './helpers';
import { useDatabaseStore } from '~/stores/database';
import { klona } from "klona";
import dedent from "dedent";
import equal from 'fast-deep-equal';

const printMsg = (...args: any[]) => printLog("Schema", "#e600a4", ...args);

let KV_USERS_CACHE: any = {};
let NS_USERS_CACHE: any = {};
let DB_USERS_CACHE: any = {};
let DB_SCOPES_CACHE: any = {};
let DB_FUNCTIONS_CACHE: any = {};
const DB_TABLES_CACHE: any = {};

export interface SchemaSyncOptions {
	users?: boolean;
	scopes?: boolean;
	functions?: boolean;
	models?: boolean;
	tables?: boolean | string[];
}

/**
 * Synchronize the remote database schema locally
 *
 * @param options Sync options
 */
export async function syncDatabaseSchema(options?: SchemaSyncOptions) {
	const { databaseSchema, setDatabaseSchema } = useDatabaseStore.getState();
	const surreal = getActiveSurreal();
	const schema = klona(databaseSchema);

	printMsg("Synchronizing database schema");

	const should = (key: keyof SchemaSyncOptions) => !options || !!options[key];

	const [kvInfo, nsInfo, dbInfo] = await Promise.all([
		surreal.querySingle<SurrealInfoKV>("INFO FOR KV"),
		surreal.querySingle<SurrealInfoNS>("INFO FOR NS"),
		surreal.querySingle<SurrealInfoDB>("INFO FOR DB")
	]);

	// KV users, NS users, and DB users
	if (should('users')) {
		if (!equal(KV_USERS_CACHE, kvInfo.users)) {
			printMsg("Updating KV users");
			schema.kvUsers = Object.values(kvInfo.users).map(info => extract_user_definition(info));
			KV_USERS_CACHE = kvInfo.users;
		}

		if (!equal(NS_USERS_CACHE, nsInfo.users)) {
			printMsg("Updating NS users");
			schema.nsUsers = Object.values(nsInfo.users).map(info => extract_user_definition(info));
			NS_USERS_CACHE = nsInfo.users;
		}

		if (!equal(DB_USERS_CACHE, dbInfo.users)) {
			printMsg("Updating DB users");
			schema.dbUsers = Object.values(dbInfo.users).map(info => extract_user_definition(info));
			DB_USERS_CACHE = dbInfo.users;
		}
	}

	// Scopes
	if (should('scopes') && !equal(DB_SCOPES_CACHE, dbInfo.scopes)) {
		printMsg("Updating scopes");
		schema.scopes = Object.values(dbInfo.scopes).map(info => extract_scope_definition(info));
		DB_SCOPES_CACHE = dbInfo.scopes;
	}

	// Schema functions
	if (should('functions') && !equal(DB_FUNCTIONS_CACHE, dbInfo.functions)) {
		printMsg("Updating functions");

		schema.functions = Object.values(dbInfo.functions).map(info => {
			const func = extract_function_definition(info);

			return {
				...func,
				name: func.name.replaceAll('`', ''),
				block: dedent(func.block.slice(1, -1))
			};
		});

		DB_FUNCTIONS_CACHE = dbInfo.functions;
	}

	// Schema models
	if (should('models')) {
		printMsg("Updating models");

		schema.models = [];

		for (const name of Object.keys(dbInfo.models)) {
			schema.models.push({
				name,
				hash: "",
				version: "",
				permission: "",
				comment: "",
			});
		}
	}

	// Tables
	if (should('tables')) {
		const isLimited = Array.isArray(options?.tables);
		const tableNames = isLimited
			? options.tables as string[]
			: Object.keys(dbInfo.tables);

		const tbInfoMap = await Promise.all(tableNames.map((table) => {
			return surreal.querySingle<SurrealInfoTB>(`INFO FOR TABLE ${tb(table)}`);
		}));

		for (const [idx, tableName] of tableNames.entries()) {
			const tbInfo = tbInfoMap[idx];
			const table = dbInfo.tables[tableName];

			const cacheData = {
				table,
				fields: tbInfo.fields,
				indexes: tbInfo.indexes,
				events: tbInfo.events,
			};

			if (equal(DB_TABLES_CACHE[tableName], cacheData)) {
				continue;
			}

			printMsg("Updating table", tableName);

			const fields = Object.values(tbInfo.fields).map(info => extract_field_definition(info));
			const indexes = Object.values(tbInfo.indexes).map(info => extract_index_definition(info));
			const events = Object.values(tbInfo.events).map(info => extract_event_definition(info));

			const index = schema.tables.findIndex(t => t.schema.name === tableName);
			const definition: TableDefinition = {
				schema: extract_table_definition(table),
				fields,
				indexes,
				events,
			};

			if (index === -1) {
				schema.tables.push(definition);
			} else {
				schema.tables[index] = definition;
			}

			DB_TABLES_CACHE[tableName] = cacheData;
		}

		if (!isLimited) {
			const staleTables = Object.keys(DB_TABLES_CACHE).filter(table => !tableNames.includes(table));

			for (const table of staleTables) {
				printMsg("Discarding table", table);

				delete DB_TABLES_CACHE[table];

				const index = schema.tables.findIndex(t => t.schema.name === table);

				if (index >= 0) {
					schema.tables.splice(index, 1);
				}
			}
		}
	}

	// Update the schema
	if (!equal(schema, databaseSchema)) {
		setDatabaseSchema(schema);
	}
}

/**
 * Build a function definition query
 */
export function buildFunctionDefinition(func: FunctionDefinition) : string {
	const args = func.arguments.map((arg) => `$${arg.name}: ${arg.kind}`).join(", ");
	const block = func.block.split("\n").map((line) => `\t${line}`).join("\n");

	let query = `DEFINE FUNCTION fn::${func.name}(${args}) {\n${block}\n}`;

	if (func.permission) {
		query += ` PERMISSIONS ${func.permission}`;
	}

	if (func.comment) {
		query += ` COMMENT "${func.comment}"`;
	}

	return query;
}

/**
 * Build a model definition query
 */
export function buildModelDefinition(func: ModelDefinition) : string {
	let query = `DEFINE MODEL ${func.name} {`;

	if (func.permission) {
		query += ` PERMISSIONS ${func.permission}`;
	}

	if (func.comment) {
		query += ` COMMENT "${func.comment}"`;
	}

	return query;
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
		if (f.name == "in" && f.kind.startsWith("record")) {
			inRecords = f.kindTables;
			hasIn = true;
		} else if (f.name == "out" && f.kind.startsWith("record")) {
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