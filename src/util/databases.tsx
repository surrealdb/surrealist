import { escapeIdent } from "surrealdb";
import {
	executeQuery,
	executeQuerySingle,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import { SchemaInfoKV, SchemaInfoNS } from "~/types";
import { getAuthDB, getAuthNS, getConnection } from "./connection";
import { parseIdent } from "./language";

export interface NamespaceOrDatabase {
	name: string;
	comment?: string;
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
