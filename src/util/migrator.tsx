import type { SurrealistConfig } from "~/types";

/**
 * Apply migrations to the config object
 */
export function applyMigrations(config: any): SurrealistConfig {
	const version = config.configVersion;

	// 2.0.0 -> 3.0.0

	if (version === 1) {
		function fixConnection(con: any) {
			con.authentication = con.connection;
			con.authentication.mode = con.connection.authMode;

			con.lastNamespace = con.connection.namespace;
			con.lastDatabase = con.connection.database;

			con.graphqlQuery = "";
			con.graphqlVariables = "";

			if (
				con.connection.authMode === "root" ||
				con.connection.authMode === "namespace"
			) {
				con.authentication.namespace = "";
			}

			if (con.connection.authMode === "root") {
				con.authentication.namespace = "";
				con.authentication.database = "";
			}

			con.authentication.accessFields = con.connection.scopeFields || [];
			con.authentication.authMode = undefined;
			con.connection = undefined;
		}
		
		for (const con of config.connections) {
			fixConnection(con);
		}

		if (config.sandbox) {
			fixConnection(config.sandbox);
		}

		config.configVersion++;
	}

	// NOTE - REPAIR: Empty accessFields array
	// Remove in the future

	for (const con of config.connections) {
		con.authentication.accessFields ??= [];
	}

	if (config.sandbox) {
		config.sandbox.authentication.accessFields ??= [];
	}

	return config;
}
