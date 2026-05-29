/**
 * Build the `surrealql.*` initializationOptions / configuration
 * payload sent to the language server.
 *
 * For now we only forward the active SurrealDB connection details so
 * the server can talk to the same database the editor is connected
 * to. Mirrors the shape consumed by the native binary's
 * `ServerSettings::from_sources`.
 */

import { getConnection } from "~/util/connection";

export interface SurqlLspSettings {
	connection?: {
		endpoint?: string;
		namespace?: string;
		database?: string;
		username?: string;
		password?: string;
		token?: string;
		access?: string;
		mode?: string;
	};
	metadata?: {
		mode: "workspace+db" | "db" | "workspace" | "filesystem";
		enableLiveMetadata: boolean;
		refreshOnSave: boolean;
	};
}

export function buildInitializationOptions(): SurqlLspSettings {
	const connection = getConnection();
	const auth = connection?.authentication;

	if (!auth) {
		// No connection yet — the server will run with empty config
		// and Surrealist's metadata pump will push DEFINE strings the
		// moment a connection is opened.
		return {
			metadata: { mode: "workspace+db", enableLiveMetadata: true, refreshOnSave: true },
		};
	}

	const endpoint =
		auth.protocol && auth.hostname ? `${auth.protocol}://${auth.hostname}` : undefined;

	return {
		connection: {
			endpoint,
			namespace: auth.namespace || undefined,
			database: auth.database || undefined,
			username: auth.username || undefined,
			password: auth.password || undefined,
			token: auth.token || undefined,
			access: auth.access || undefined,
			mode: auth.mode,
		},
		metadata: {
			mode: "workspace+db",
			enableLiveMetadata: true,
			refreshOnSave: true,
		},
	};
}
