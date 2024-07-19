import { SurrealistConfig } from "~/types";

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

			if (con.connection.authMode === "root" || con.connection.authMode === "namespace") {
				con.authentication.namespace = "";
			}

			if (con.connection.authMode === "root") {
				con.authentication.namespace = "";
				con.authentication.database = "";
			}

			delete con.authentication.authMode;
			delete con.connection;
		}

		config.configVersion++;
	}

	return config;
}