import { escapeIdent } from "surrealdb";
import { executeQuery, executeQuerySingle } from "~/screens/surrealist/connection/connection";
import { useDatabaseStore } from "~/stores/database";
import { getAuthDB, getAuthNS, getConnection } from "./connection";
import { parseIdent } from "./language";

/**
 * Fetch a list of available namespaces
 */
export async function fetchNamespaceList() {
	const { currentState } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected") {
		return [];
	}

	const authNS = getAuthNS(connection.authentication);

	if (authNS) {
		return [authNS];
	}

	const { namespaces } = await executeQuerySingle("INFO FOR KV");

	return Object.keys(namespaces).map((ns) => parseIdent(ns));
}

/**
 * Fetch a list of available namespaces
 */
export async function fetchDatabaseList(namespace: string) {
	const { currentState } = useDatabaseStore.getState();
	const connection = getConnection();

	if (!connection || currentState !== "connected" || !namespace) {
		return [];
	}

	const authDB = getAuthDB(connection.authentication);

	if (authDB) {
		return [authDB];
	}

	const [_, { result }] = await executeQuery(`USE NS ${escapeIdent(namespace)}; INFO FOR NS`);

	return Object.keys(result.databases).map((db) => parseIdent(db));
}
