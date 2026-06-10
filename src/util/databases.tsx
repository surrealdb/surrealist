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

export async function fetchDatabaseHierarchy(): Promise<DatabaseHierarchyEntry[]> {
	const namespaces = await fetchNamespaceList();

	return Promise.all(
		namespaces.map(async (namespace) => ({
			namespace,
			databases: await fetchDatabaseList(namespace.name),
		})),
	);
}

/**
 * Fetch a list of available namespaces
 */
export async function fetchNamespaceList(): Promise<NamespaceOrDatabase[]> {
	const { currentState } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected") {
		return [];
	}

	const authNS = getAuthNS(connection.authentication);

	if (authNS) {
		return [authNS];
	}

	const { namespaces } = await executeQuerySingle<SchemaInfoKV>("INFO FOR KV STRUCTURE");

	return namespaces.map((ns) => ({
		name: parseIdent(ns.name),
		comment: ns.comment,
	}));
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
