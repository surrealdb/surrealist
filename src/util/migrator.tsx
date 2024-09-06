import type { SurrealistConfig } from "~/types";

/**
 * Apply migrations to the config object
 */
export function applyMigrations(config: any): SurrealistConfig {
	const version = config.configVersion;

	// 2.0.0
	if (version === 1) {
		for (const con of config.connections) {
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

			con.authentication.authMode = undefined;
			con.connection = undefined;
		}

		config.configVersion++;
	}

	return config;
}
