import dedent from "dedent";
import equal from 'fast-deep-equal';
import { SchemaFunction, SchemaModel, SchemaInfoDB, SchemaInfoKV, SchemaInfoNS, SchemaInfoTB, TableInfo } from "~/types";
import { printLog, tb } from './helpers';
import { useDatabaseStore } from '~/stores/database';
import { executeQuerySingle } from '~/connection';
import { createDatabaseSchema } from "./defaults";
import { klona } from "klona";

const printMsg = (...args: any[]) => printLog("Schema", "#e600a4", ...args);

const emptyKV = () => ({ users: [] });
const emptyNS = () => ({ users: [] });
const emptyDB = () => ({ users: [], functions: [], models: [], tables: [], scopes: [] });

export interface SchemaSyncOptions {
	tables?: string[];
}

/**
 * Synchronize the remote database schema locally
 *
 * @param options Sync options
 */
export async function syncDatabaseSchema(options?: SchemaSyncOptions) {
	const { isConnected } = useDatabaseStore.getState();

	if (!isConnected) {
		return;
	}

	const { databaseSchema, setDatabaseSchema } = useDatabaseStore.getState();
	const schema = createDatabaseSchema();

	printMsg("Synchronizing database schema");

	const [kvInfoTask, nsInfoTask, dbInfoTask] = await Promise.allSettled([
		executeQuerySingle<SchemaInfoKV>("INFO FOR KV STRUCTURE"),
		executeQuerySingle<SchemaInfoNS>("INFO FOR NS STRUCTURE"),
		executeQuerySingle<SchemaInfoDB>("INFO FOR DB STRUCTURE")
	]);

	const kvInfo = kvInfoTask.status === "fulfilled" ? kvInfoTask.value : emptyKV();
	const nsInfo = nsInfoTask.status === "fulfilled" ? nsInfoTask.value : emptyNS();
	const dbInfo = dbInfoTask.status === "fulfilled" ? dbInfoTask.value : emptyDB();

	// KV users, NS users, and DB users
	schema.kvUsers = kvInfo.users;
	schema.nsUsers = nsInfo.users;
	schema.dbUsers = dbInfo.users;

	// Scopes
	schema.scopes = dbInfo.scopes.map(sc => ({
		...sc,
		signin: sc?.signin?.slice(1, -1),
		signup: sc?.signup?.slice(1, -1),
	}));

	// Schema functions
	schema.functions = dbInfo.functions.map(info => ({
		...info,
		name: info.name.replaceAll('`', ''),
		block: dedent(info.block.slice(1, -1))
	}));

	// Schema models
	schema.models = dbInfo.models;

	// Tables
	const isLimited = Array.isArray(options?.tables);
	const tableNames = isLimited
		? options!.tables as string[]
		: dbInfo.tables.map(t => t.name);

	const tbInfoMap = await Promise.all(tableNames.map((table) => {
		return executeQuerySingle<SchemaInfoTB>(`INFO FOR TABLE ${tb(table)} STRUCTURE`);
	}));

	if (isLimited) {
		schema.tables = klona(databaseSchema.tables);
	}

	for (const [idx, tableName] of tableNames.entries()) {
		printMsg("Updating table", tableName);

		const info = tbInfoMap[idx];
		const table = dbInfo.tables.find(t => t.name === tableName)!;
		const index = schema.tables.findIndex(t => t.schema.name === tableName);

		if (!table) {
			schema.tables.splice(index, 1);
			continue;
		}

		const definition: TableInfo = {
			schema: {
				...table,
				changefeed: typeof table.changefeed === "object"
					? table.changefeed
					: typeof table.changefeed === "string" ? {
						expiry: (table.changefeed as string).replaceAll(/CHANGEFEED|INCLUDE ORIGINAL/g, '').trim(),
						store_original: (table.changefeed as string).includes('INCLUDE ORIGINAL'),
					} : undefined
			},
			fields: Object.values(info.fields),
			indexes: Object.values(info.indexes),
			events: Object.values(info.events).map(ev => ({
				...ev,
				then: ev.then.map(th => th.slice(1, -1))
			})),
		};

		if (!isLimited || index === -1) {
			schema.tables.push(definition);
		} else {
			schema.tables[index] = definition;
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
export function buildFunctionDefinition(func: SchemaFunction) : string {
	const args = func.args.map(([name, kind]) => `$${name}: ${kind}`).join(", ");
	const block = func.block.split("\n").map((line) => `\t${line}`).join("\n");

	let query = `DEFINE FUNCTION fn::${func.name}(${args}) {\n${block}\n}`;

	if (func.permissions) {
		query += ` PERMISSIONS ${displaySchemaPermission(func.permissions)}`;
	}

	if (func.comment) {
		query += ` COMMENT "${func.comment}"`;
	}

	return query;
}

/**
 * Build a model definition query
 */
export function buildModelDefinition(func: SchemaModel) : string {
	let query = `DEFINE MODEL ${func.name} {`;

	if (func.permission) {
		query += ` PERMISSIONS ${displaySchemaPermission(func.permission)}`;
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
export function extractEdgeRecords(table: TableInfo): [boolean, string[], string[]] {
	const { kind } = table.schema;

	if (kind.kind === "RELATION") {
		return [
			kind.kind === "RELATION",
			kind.in || [],
			kind.out || []
		];
	}

	let hasIn = false;
	let hasOut = false;
	let inRecords: string[] = [];
	let outRecords: string[] = [];

	for (const f of table.fields) {
		if (f.name == "in" && f.kind?.startsWith("record")) {
			inRecords = extractKindMeta(f.kind);
			hasIn = true;
		} else if (f.name == "out" && f.kind?.startsWith("record")) {
			outRecords = extractKindMeta(f.kind);
			hasOut = true;
		}
	}

	return [hasIn && hasOut, inRecords, outRecords];
}

/**
 * Extract the kind meta from a kind string
 *
 * @param kind The kind string
 * @returns The meta
 */
export function extractKindMeta(kind: string): string[] {
	const [_, meta] = /^\w+<(.*)>$/.exec(kind) || [];

	return meta?.split("|").map(m => m.trim()) || [];
}

/**
 * Returns true if the table is an edge table
 *
 * @param table The table to check
 * @returns True if the table is an edge table
 */
export function isEdgeTable(table: TableInfo) {
	return extractEdgeRecords(table)[0];
}

/**
 * Display a single schema permission
 *
 * @param permission Either a string which will be transformed into `WHERE ${permission}`, or a boolean representing FULL/NONE
 * @returns A string which is the permission in SurrealQL format
 */
export function displaySchemaPermission(permission: string | boolean) {
	return typeof permission == 'string'
		? `WHERE ${permission}`
		: permission
			? 'FULL'
			: 'NONE';
}
