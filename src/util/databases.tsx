import type { QueryClient } from "@tanstack/react-query";
import { escapeIdent } from "surrealdb";
import {
	executeQuery,
	executeQuerySingle,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import { SchemaInfoKV, SchemaInfoNS } from "~/types";
import { getAuthDB, getAuthNS, getConnection } from "./connection";
import { parseIdent } from "./language";

export const databaseHierarchyQueryKey = (connectionId: string) =>
	["database-hierarchy", connectionId] as const;

export function invalidateDatabaseHierarchy(queryClient: QueryClient, connectionId: string) {
	return queryClient.invalidateQueries({
		queryKey: databaseHierarchyQueryKey(connectionId),
	});
}

export interface NamespaceOrDatabase {
	name: string;
	comment?: string;
}

export interface DatabaseHierarchyEntry {
	namespace: NamespaceOrDatabase;
	databases: NamespaceOrDatabase[];
}

export interface InstanceDefaults {
	namespace?: string;
	database?: string;
}

export interface DatabaseHierarchy {
	entries: DatabaseHierarchyEntry[];
	defaults: InstanceDefaults;
}

export async function fetchDatabaseHierarchy(): Promise<DatabaseHierarchy> {
	const { namespaces, defaults } = await fetchNamespaceListWithDefaults();

	const entries = await Promise.all(
		namespaces.map(async (namespace) => ({
			namespace,
			databases: await fetchDatabaseList(namespace.name),
		})),
	);

	return { entries, defaults };
}

export async function fetchInstanceDefaults(): Promise<InstanceDefaults> {
	const { defaults } = await fetchNamespaceListWithDefaults();

	return defaults;
}

async function fetchNamespaceListWithDefaults(): Promise<{
	namespaces: NamespaceOrDatabase[];
	defaults: InstanceDefaults;
}> {
	const { currentState } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected") {
		return { namespaces: [], defaults: {} };
	}

	const authNS = getAuthNS(connection.authentication);

	if (authNS) {
		return { namespaces: [authNS], defaults: {} };
	}

	try {
		const info = await executeQuerySingle<SchemaInfoKV>("INFO FOR KV STRUCTURE");

		return {
			namespaces: info.namespaces.map((ns) => ({
				name: parseIdent(ns.name),
				comment: ns.comment,
			})),
			defaults: {
				namespace: info.defaults?.namespace,
				database: info.defaults?.database,
			},
		};
	} catch {
		return { namespaces: [], defaults: {} };
	}
}

export async function setInstanceDefaults(namespace: string, database: string) {
	await executeQuery(/* surql */ `
		DEFINE CONFIG OVERWRITE DEFAULT
			NAMESPACE ${escapeIdent(namespace)}
			DATABASE ${escapeIdent(database)};
	`);
}

export async function setNamespaceComment(name: string, comment?: string) {
	await executeQuery(
		/* surql */ `DEFINE NAMESPACE OVERWRITE ${escapeIdent(name)} COMMENT $comment`,
		{ comment },
	);
}

export async function setDatabaseComment(namespace: string, database: string, comment?: string) {
	await executeQuery(
		/* surql */ `
			USE NS ${escapeIdent(namespace)};
			DEFINE DATABASE OVERWRITE ${escapeIdent(database)} COMMENT $comment;
		`,
		{ comment },
	);
}

/**
 * Fetch a list of available namespaces
 */
export async function fetchNamespaceList(): Promise<NamespaceOrDatabase[]> {
	const { namespaces } = await fetchNamespaceListWithDefaults();

	return namespaces;
}

/**
 * Fetch a list of available namespaces
 */
export async function fetchDatabaseList(namespace: string): Promise<NamespaceOrDatabase[]> {
	const { currentState } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected" || !namespace) {
		return [];
	}

	const authDB = getAuthDB(connection.authentication);

	if (authDB) {
		return [authDB];
	}

	const [_, result] = await executeQuery(
		`USE NS ${escapeIdent(namespace)}; INFO FOR NS STRUCTURE`,
	);
	const { databases } = result.result as SchemaInfoNS;

	return databases.map((db) => ({
		name: parseIdent(db.name),
		comment: db.comment,
	}));
}
