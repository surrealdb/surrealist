import { Open, SurrealistConfig } from "~/types";

/**
 * Perform migrations on the given config object.
 */
export function migrateConfig(config: Open<SurrealistConfig>) {
	// 1.6.0 - Migrate auth and view behavior
	for (const tab of config.tabs) {
		if (!tab.activeView) {
			tab.activeView = "query";
		}

		if (tab.connection.scopeFields === undefined) {
			if (tab.connection.authMode == "scope") {
				tab.connection.scopeFields = [
					{ subject: "user", value: tab.connection.username },
					{ subject: "pass", value: tab.connection.password },
				];
			} else {
				tab.connection.scopeFields = [];
			}
		}
	}

	// 1.7.0 - Migrate tabs to environments
	for (const tab of config.tabs) {
		if (!tab.environment) {
			tab.environment = config.environments[0].id;
			tab.pinned = false;
		}
	}

	// 1.8.0 - Define pinned tables array
	for (const tab of config.tabs) {
		if (!tab.pinnedTables) {
			tab.pinnedTables = [];
		}
	}
}
