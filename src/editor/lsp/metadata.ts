/**
 * Pump live SurrealDB schema definitions into the language-server
 * worker.
 *
 * Surrealist already keeps a parsed schema in `useDatabaseStore`
 * (populated by `syncConnectionSchema` whenever a connection is
 * activated / reloaded). The language server, however, expects raw
 * `DEFINE …` statements so it can re-parse them through the same
 * tree-sitter pipeline as user buffers — that way live tables /
 * fields / functions show up in completions and hover with the
 * matching origin and inference metadata.
 *
 * This module subscribes to the database store and re-builds the
 * `DEFINE` statement set whenever the schema changes, then pushes the
 * resulting list into the worker.
 */

import { useDatabaseStore } from "~/stores/database";
import type {
	DatabaseSchema,
	Permissions,
	SchemaEvent,
	SchemaField,
	SchemaFunction,
	SchemaIndex,
	SchemaParameter,
	TableInfo,
} from "~/types";
import { watchStore } from "~/util/config";
import { displaySchemaPermission } from "~/util/schema";
import type { SurqlLspClient } from "./client";

/**
 * Listener invoked after every successful metadata flush with the
 * latest define count, used by the LSP status indicator.
 */
export type MetadataCountListener = (count: number) => void;

const metadataCountListeners = new Set<MetadataCountListener>();
let lastMetadataCount = 0;

/**
 * Subscribe to changes in the live metadata define count.
 * Fires synchronously with the current value on attach.
 */
export function onLiveMetadataCount(listener: MetadataCountListener): () => void {
	metadataCountListeners.add(listener);
	listener(lastMetadataCount);
	return () => {
		metadataCountListeners.delete(listener);
	};
}

/**
 * Subscribe to the active database schema and forward every schema
 * change to the language-server worker as a list of `DEFINE …`
 * strings. Returns an unsubscribe function.
 *
 * Uses [`watchStore`] so we only re-stringify and post when the
 * `connectionSchema.database` slice actually changes (deep equality)
 * rather than on every database-store mutation.
 *
 * After a manual restart the new worker has no metadata snapshot;
 * we listen for `client.onRestart` and re-push the latest schema so
 * completions and diagnostics resume seamlessly without waiting for
 * the next schema reload.
 */
export function attachLiveMetadataPump(client: SurqlLspClient): () => void {
	const flush = (schema: DatabaseSchema | undefined) => {
		const defines = schema ? buildDefineStrings(schema) : [];
		client.setLiveMetadata(defines);
		lastMetadataCount = defines.length;
		for (const listener of metadataCountListeners) {
			listener(lastMetadataCount);
		}
	};

	const off = watchStore({
		initial: true,
		store: useDatabaseStore,
		select: (state) => state.connectionSchema.database,
		then: flush,
	});

	const offRestart = client.onRestart(() => {
		flush(useDatabaseStore.getState().connectionSchema.database);
	});

	return () => {
		off();
		offRestart();
	};
}

function buildDefineStrings(schema: DatabaseSchema): string[] {
	const defines: string[] = [];

	for (const table of schema.tables) {
		defines.push(buildTableDefine(table));
		for (const field of table.fields) {
			defines.push(buildFieldDefine(table.schema.name, field));
		}
		for (const event of table.events) {
			defines.push(buildEventDefine(table.schema.name, event));
		}
		for (const index of table.indexes) {
			defines.push(buildIndexDefine(table.schema.name, index));
		}
	}

	for (const fn of schema.functions ?? []) {
		defines.push(buildFunctionDefine(fn));
	}

	for (const param of schema.params ?? []) {
		defines.push(buildParamDefine(param));
	}

	return defines;
}

function buildTableDefine(table: TableInfo): string {
	const schema = table.schema;
	const schemafull = schema.full || schema.schemafull ? "SCHEMAFULL" : "SCHEMALESS";
	const permissions = formatPermissionsClause(schema.permissions);
	return `DEFINE TABLE ${schema.name} ${schemafull}${permissions};`;
}

function buildFieldDefine(tableName: string, field: SchemaField): string {
	const type = field.kind ? ` TYPE ${field.kind}` : "";
	const value = field.value ? ` VALUE ${field.value}` : "";
	const assert = field.assert ? ` ASSERT ${field.assert}` : "";
	const flex = field.flex ? " FLEXIBLE" : "";
	const readonly = field.readonly ? " READONLY" : "";
	const permissions = formatPermissionsClause(field.permissions);
	return `DEFINE FIELD ${field.name} ON ${tableName}${flex}${readonly}${type}${value}${assert}${permissions};`;
}

function formatPermissionsClause(permissions: Permissions): string {
	const rules: string[] = [];

	for (const action of ["select", "create", "update", "delete"] as const) {
		const rule = permissions[action];
		if (rule === undefined) {
			continue;
		}
		rules.push(`${action} ${displaySchemaPermission(rule)}`);
	}

	if (rules.length === 0) {
		return "";
	}

	return ` PERMISSIONS FOR ${rules.join(", ")}`;
}

function buildEventDefine(tableName: string, event: SchemaEvent): string {
	const when = event.when ? ` WHEN ${event.when}` : "";
	const then = event.then?.length ? event.then.join("; ") : "";
	return `DEFINE EVENT ${event.name} ON ${tableName}${when} THEN { ${then} };`;
}

function buildIndexDefine(tableName: string, index: SchemaIndex): string {
	const fields = index.cols ?? "";
	const trailing = index.index ? ` ${index.index}` : "";
	return `DEFINE INDEX ${index.name} ON ${tableName} FIELDS ${fields}${trailing};`;
}

function buildFunctionDefine(fn: SchemaFunction): string {
	const params = (fn.args ?? [])
		.map(([name, kind]) => (kind ? `$${name}: ${kind}` : `$${name}`))
		.join(", ");
	const returns = fn.returns ? ` -> ${fn.returns}` : "";
	const block = fn.block ?? "";
	return `DEFINE FUNCTION fn::${fn.name}(${params})${returns} { ${block} };`;
}

function buildParamDefine(param: SchemaParameter): string {
	return `DEFINE PARAM $${param.name} VALUE ${param.value ?? "NONE"};`;
}
