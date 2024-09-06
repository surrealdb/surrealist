import { objectify } from "radash";
import type { QueryResult, ScopeAuth } from "surrealdb";
import { fetchAPI } from "~/screens/cloud-manage/api";
import type { AuthDetails, Authentication, QueryResponse } from "~/types";
import { getSetting } from "~/util/config";
import { featureFlags } from "~/util/feature-flags";

export async function composeAuthentication(
	connection: Authentication,
): Promise<AuthDetails> {
	const {
		mode: authMode,
		username,
		password,
		namespace,
		database,
		token,
		cloudInstance,
	} = connection;

	switch (authMode) {
		case "root": {
			return { username, password };
		}
		case "namespace": {
			return { namespace, username, password };
		}
		case "database": {
			return { namespace, database, username, password };
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
				throw new Error("Failed to authenticate with cloud instance", {
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
	const { namespace, database, scope, scopeFields } = connection;
	const fields = objectify(
		scopeFields,
		(f) => f.subject,
		(f) => f.value,
	);

	return { namespace, database, scope, ...fields };
}

export function getVersionTimeout() {
	const enabled = featureFlags.get("database_version_check");
	const timeout = (getSetting("behavior", "versionCheckTimeout") ?? 5) * 1000;
	return [enabled, timeout] as const;
}

export function getReconnectInterval() {
	return (getSetting("behavior", "reconnectInterval") ?? 3) * 1000;
}
