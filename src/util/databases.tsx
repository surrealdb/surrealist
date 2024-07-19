import { executeQuery, executeQuerySingle } from "~/screens/database/connection";
import { useDatabaseStore } from "~/stores/database";
import { getConnection, getAuthNS, getAuthDB } from "./connection";

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
	} else {
		const { namespaces } = await executeQuerySingle(`INFO FOR KV`);

		return Object.keys(namespaces);
	}
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
	} else {
		const [_, { result }] = await executeQuery(`USE NS ${namespace}; INFO FOR NS`);

		return Object.keys(result.databases);
	}
}