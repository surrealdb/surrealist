import { ConnectionOptions } from "~/types";
import { connectionUri, versionUri } from "./helpers";
import { compare } from "semver";
import { createSurreal } from "~/connection";

async function fetchRpcVersion(connection: ConnectionOptions) {
	const surreal = createSurreal();

	try {
		const rpcEndpoint = connectionUri(connection);

		await surreal.connect(rpcEndpoint);

		return await surreal.version();
	} catch(err: any) {
		console.warn('Failed to retrieve database version', err);
		return null;
	} finally {
		await surreal.close();
	}
}

async function fetchLegacyVersion(connection: ConnectionOptions) {
	try {
		const endpoint = versionUri(connection);

		if (!endpoint) {
			throw new Error("No version endpoint");
		}

		return await fetch(endpoint).then(res => res.text());
	} catch {
		return null;
	}
}

/**
 * Should we check the given connection for a database version
 */
export function shouldCheckVersion(connection: ConnectionOptions) {
	return connection.protocol !== "mem" && connection.protocol !== "indxdb";
}

/**
 * Attempt to query the remote database version
 */
export async function queryDatabaseVersion(connection: ConnectionOptions) {
	try {
		const version = await fetchRpcVersion(connection) || await fetchLegacyVersion(connection);

		if (!version) {
			return null;
		}

		return version.replace(/^surrealdb-/, "").replace(/\+.+/, "");
	} catch (err: any) {
		console.error('Failed to retrieve database version', err);
		return null;
	}
}

/**
 * Returns whether the given database version is unsupported
 */
export function isUnsupported(version: string) {
	return compare(version, import.meta.env.SDB_VERSION) < 0;
}