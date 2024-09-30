import { isArray, isObject } from "radash";
import type { Connection, SurrealistConfig } from "~/types";

/**
 * Apply migrations to the config object
 * 
 * Policy:
 * - The config version is only incremented when backwards-breaking changes are made
 * - Config version bumps should only be shipped in major releases
 * - Non-backwards-breaking changes must be compatible with the previous version
 * - Additions to the config should have a default value in defaults, or computed here
 */
export function applyMigrations(config: any): SurrealistConfig {
	const version = config.configVersion ?? -1;

	// 2.0.0 -> 3.0.0: Convert the old connection format to the new one

	if (version === 1) {

		applyToConnections(config, (con) => {
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
		});

		config.configVersion++;
	}

	// 3.0.0 -> 3.0.2: Define missing access fields array

	applyToConnections(config, (con) => {
		con.authentication.accessFields ??= [];
	});

	// 3.0.2 -> 3.0.3: Adopt new resultFormat setting

	applyToConnections(config, (con) => {
		for (const query of (con.queries || [])) {
			query.resultFormat ??= "sql";
		}
	});


	return config;
}

function applyToConnections(config: any, cb: (con: any) => void) {
	if (config.connections && isArray(config.connections)) {
		for (const con of config.connections) {
			cb(con);
		}
	}

	if (config.sandbox && isObject(config.sandbox)) {
		cb(config.sandbox);
	}
}