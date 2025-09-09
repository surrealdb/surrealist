import equal from "fast-deep-equal";
import { klona } from "klona";
import { escapeIdent } from "surrealdb";
import { adapter } from "~/adapter";
import { executeQuery, executeQuerySingle } from "~/screens/surrealist/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import type {
	SchemaFunction,
	SchemaInfoDB,
	SchemaInfoKV,
	SchemaInfoNS,
	SchemaInfoTB,
	SchemaModel,
	SchemaParameter,
	TableInfo,
	TableVariant,
} from "~/types";
import { dedent } from "./dedent";
import { createConnectionSchema } from "./defaults";
import { getStatementCount } from "./surrealql";

export interface SchemaSyncOptions {
	tables?: string[];
	clearRoot?: boolean;
	clearNamespace?: boolean;
	clearDatabase?: boolean;
}

/**
 * Synchronize the remote connection schema locally
 *
 * @param options Sync options
 */
export async function syncConnectionSchema(options?: SchemaSyncOptions) {
	const { currentState, connectionSchema, setDatabaseSchema } = useDatabaseStore.getState();
	const { tables: onlyTables, clearRoot, clearNamespace, clearDatabase } = options ?? {};

	if (clearRoot || clearNamespace || clearDatabase) {
		const reset = createConnectionSchema();

		setDatabaseSchema({
			root: clearRoot ? reset.root : connectionSchema.root,
			namespace: clearNamespace ? reset.namespace : connectionSchema.namespace,
			database: clearDatabase ? reset.database : connectionSchema.database,
		});
	}

	if (currentState !== "connected") {
		return;
	}

	const schema = createConnectionSchema();

	adapter.log("Schema", "Synchronizing database schema");

	const [kvInfoTask, nsInfoTask, dbInfoTask] = await Promise.allSettled([
		executeQuerySingle<SchemaInfoKV>("INFO FOR KV STRUCTURE"),
		executeQuerySingle<SchemaInfoNS>("INFO FOR NS STRUCTURE"),
		executeQuerySingle<SchemaInfoDB>("INFO FOR DB STRUCTURE"),
	]);

	if (kvInfoTask.status === "fulfilled") {
		const { namespaces, accesses, users } = kvInfoTask.value;

		schema.root.namespaces = namespaces;
		schema.root.accesses = accesses ?? [];
		schema.root.users = users;

		// TODO Trim access queries
	}

	if (nsInfoTask.status === "fulfilled") {
		const { databases, accesses, users } = nsInfoTask.value;

		schema.namespace.databases = databases;
		schema.namespace.accesses = accesses ?? [];
		schema.namespace.users = users;

		// TODO Trim access queries
	}

	if (dbInfoTask.status === "fulfilled") {
		const { accesses, models, users, functions, tables, params } = dbInfoTask.value;

		schema.database.accesses = accesses ?? [];
		schema.database.models = models;
		schema.database.users = users;
		schema.database.params = params;

		// TODO Trim access queries

		// schema.database.accesses = (schema.database.accesses || []).map((sc) => ({
		// 	...sc,
		// 	signin: sc?.signin?.slice(1, -1),
		// 	signup: sc?.signup?.slice(1, -1),
		// }));

		// Schema functions
		schema.database.functions = functions.map((info) => ({
			...info,
			name: info.name.replaceAll("`", ""),
			block: readBlock(info.block),
			comment: info.comment || "",
			returns: info.returns || "",
		}));

		// Tables
		const isLimited = Array.isArray(onlyTables);
		const tablesToSync = isLimited ? onlyTables : tables.map((t) => t.name);

		const tbInfoMap = await executeQuery(
			tablesToSync
				.map((table) => `INFO FOR TABLE ${escapeIdent(table)} STRUCTURE;`)
				.join("\n"),
		);

		adapter.log("Schema", `Table structures: ${JSON.stringify(tbInfoMap)}`);

		if (isLimited) {
			schema.database.tables = klona(connectionSchema.database.tables);
		}

		for (const [idx, tableName] of tablesToSync.entries()) {
			adapter.log("Schema", `Updating table ${tableName}`);

			const tableStruct = tbInfoMap[idx].result as SchemaInfoTB;

			const tableInfo = tables.find((t) => t.name === tableName);
			const existingIndex = schema.database.tables.findIndex(
				(t) => t.schema.name === tableName,
			);

			if (!tableInfo) {
				schema.database.tables.splice(existingIndex, 1);
				continue;
			}

			const definition: TableInfo = {
				schema: tableInfo,
				fields: Object.values(tableStruct.fields),
				indexes: Object.values(tableStruct.indexes),
				events: Object.values(tableStruct.events).map((ev) => ({
					...ev,
					then: ev.then.map(readBlock),
				})),
			};

			if (!isLimited || existingIndex === -1) {
				schema.database.tables.push(definition);
			} else {
				schema.database.tables[existingIndex] = definition;
			}
		}
	}

	// Update the schema
	if (!equal(schema, connectionSchema)) {
		console.debug("Updated schema:", schema);
		setDatabaseSchema(schema);
	}
}

/**
 * Build a function definition query
 */
export function buildFunctionDefinition(func: SchemaFunction): string {
	const args = func.args.map(([name, kind]) => `$${name}: ${kind}`).join(", ");
	const block = func.block
		.split("\n")
		.map((line) => `\t${line}`)
		.join("\n");

	let query = `DEFINE FUNCTION OVERWRITE fn::${func.name}(${args})`;

	if (func.returns) {
		query += ` -> ${func.returns}`;
	}

	query += ` {\n${block}\n}`;

	if (func.permissions !== undefined) {
		query += ` PERMISSIONS ${displaySchemaPermission(func.permissions)}`;
	}

	if (func.comment !== undefined) {
		query += ` COMMENT "${func.comment}"`;
	}

	return query;
}

/**
 * Build a parameter definition query
 */
export function buildParameterDefinition(param: SchemaParameter): string {
	let query = `DEFINE PARAM OVERWRITE $${param.name}`;

	if (param.permissions !== undefined) {
		query += ` PERMISSIONS ${displaySchemaPermission(param.permissions)}`;
	}

	if (param.comment !== undefined) {
		query += ` COMMENT "${param.comment}"`;
	}

	if (param.value !== undefined) {
		query += ` VALUE ${param.value}`;
	}

	return query;
}

/**
 * Build a model definition query
 */
export function buildModelDefinition(func: SchemaModel): string {
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
 * Returns the variant of a given table
 */
export function getTableVariant(table: TableInfo): TableVariant {
	if (table.schema.view) {
		return "view";
	}

	return table.schema.kind.kind === "RELATION" ? "relation" : "normal";
}

/**
 * Returns true if the table is an edge table
 *
 * @param table The table to check
 * @returns True if the table is an edge table
 */
export function extractEdgeRecords(table: TableInfo): [string[], string[]] {
	const { kind } = table.schema;

	return [kind.in || [], kind.out || []];
}

/**
 * Display a single schema permission
 *
 * @param permission Either a string which will be transformed into `WHERE ${permission}`, or a boolean representing FULL/NONE
 * @returns A string which is the permission in SurrealQL format
 */
export function displaySchemaPermission(permission: string | boolean) {
	return typeof permission === "string" ? `WHERE ${permission}` : permission ? "FULL" : "NONE";
}

/**
 * Trim the outer braces or parenthsis of a block
 */
export function readBlock(block: string | undefined) {
	const hasBraces = block?.at(0) === "{" && block?.at(-1) === "}";
	const hasParen = block?.at(0) === "(" && block?.at(-1) === ")";
	const trimmed = hasBraces || hasParen ? block.slice(1, -1) : (block ?? "");

	return dedent(trimmed);
}

/**
 * Wrap a block in braces or parenthesis
 */
export function writeBlock(block: string) {
	const [openSymbol, closeSymbol] = getStatementCount(block) > 1 ? ["{", "}"] : ["(", ")"];

	return `${openSymbol}\n${block}\n${closeSymbol}`;
}
