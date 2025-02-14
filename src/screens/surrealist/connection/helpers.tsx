import { objectify } from "radash";
import type { AccessRecordAuth, QueryResult, ScopeAuth } from "surrealdb";
import { fetchAPI } from "~/cloud/api";
import type { AuthDetails, Authentication, QueryResponse } from "~/types";
import { getSetting } from "~/util/config";
import { CloudError } from "~/util/errors";
import { featureFlags } from "~/util/feature-flags";

export async function composeAuthentication(connection: Authentication): Promise<AuthDetails> {
	const { mode, username, password, namespace, database, token, cloudInstance } = connection;

	switch (mode) {
		case "root": {
			return { username, password };
		}
		case "namespace": {
			return { namespace, username, password };
		}
		case "database": {
			return { namespace, database, username, password };
		}
		case "access": {
			return buildAccessAuth(connection);
		}
		case "scope": {
			return buildScopeAuth(connection);
		}
		case "token": {
			return token;
		}
		case "cloud": {
			if (!cloudInstance) {
				return undefined;
			}

			try {
				const response = await fetchAPI<{ token: string }>(
					`/instances/${cloudInstance}/auth`,
				);

				return response.token;
			} catch (err: any) {
				throw new CloudError("Failed to authenticate with cloud instance", {
					cause: err,
				});
			}
		}
		default: {
			return undefined;
		}
	}
}

export function mapResults(response: QueryResult<unknown>[]): QueryResponse[] {
	return response.map((res) => ({
		success: res.status === "OK",
		result: res.result,
		execution_time: res.time,
	}));
}

export function buildScopeAuth(connection: Authentication): ScopeAuth {
	const { namespace, database, scope, accessFields } = connection;
	const fields = objectify(
		accessFields,
		(f) => f.subject,
		(f) => f.value,
	);

	return { namespace, database, scope, ...fields };
}

export function buildAccessAuth(connection: Authentication): AccessRecordAuth {
	const { namespace, database, access, accessFields } = connection;
	const variables = objectify(
		accessFields,
		(f) => f.subject,
		(f) => f.value,
	);

	return { namespace, database, access, variables };
}

export function getVersionTimeout() {
	const enabled = featureFlags.get("database_version_check");
	const timeout = (getSetting("behavior", "versionCheckTimeout") ?? 5) * 1000;
	return [enabled, timeout] as const;
}

export function getReconnectInterval() {
	return (getSetting("behavior", "reconnectInterval") ?? 3) * 1000;
}
