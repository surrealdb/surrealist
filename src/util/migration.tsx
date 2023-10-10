import { Open, SurrealistConfig } from "~/types";
import { createBaseEnvironment } from "./defaults";

/**
 * Perform migrations on the given config object.
 */
export function migrateConfig(config: Open<SurrealistConfig>) {

	// 1.6.0 - Migrate auth and view behavior
	for (const tab of config.tabs) {
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
	if (config.environments.length === 0) {
		config.environments.push(createBaseEnvironment());
	}
	
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

	// 1.9.0 - Set default designer options
	if (!config.defaultDesignerLayoutMode) {
		config.defaultDesignerLayoutMode = 'diagram';
	}

	if (!config.defaultDesignerNodeMode) {
		config.defaultDesignerNodeMode = 'fields';
	}

	// 1.10.0 - Adopt query tabs
	for (const tab of config.tabs as any[]) {
		if (!tab.queries?.length) {
			tab.queries = [{ id: 1, text: tab.query }];
			tab.activeQueryId = 1;
			tab.lastQueryId = 1;
		}

		if (!tab.liveQueries) {
			tab.liveQueries = [];
		}
	}
}
