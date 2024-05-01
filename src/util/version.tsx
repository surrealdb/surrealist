import { ConnectionOptions } from "~/types";
import { connectionUri, versionUri } from "./helpers";
import { compare } from "semver";

async function fetchRpcVersion(connection: ConnectionOptions) {
	try {
		const endpoint = connectionUri(connection);
		const response = await fetch(endpoint, {
			method: "POST",
			body: JSON.stringify({ id: 1, method: "version" })
		});

		const json = await response.json();
		const version = json.result as string;

		if (typeof version !== "string") {
			throw new TypeError("Invalid version response");
		}

		return version;
	} catch {
		return null;
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
export function shouldQueryDatabaseVersion(connection: ConnectionOptions) {
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