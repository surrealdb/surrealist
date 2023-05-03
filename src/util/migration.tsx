import { Open, SurrealistConfig } from "~/typings";
import { newId } from "./helpers";

/**
 * Perform migrations on the given config object.
 */
export function migrateConfig(config: Open<SurrealistConfig>) {

	// 1.6.0 - Migrate auth and view behavior
	config.tabs.forEach((tab: any) => {
		if (!tab.activeView) {
			tab.activeView = 'query';
		}

		if (tab.connection.scopeFields === undefined) {
			if (tab.connection.authMode == 'scope') {
				tab.connection.scopeFields = [
					{ subject: 'user', value: tab.connection.username },
					{ subject: 'pass', value: tab.connection.password }
				];
			} else {
				tab.connection.scopeFields = [];
			}
		}
	});

	// 1.7.0 - Migrate tabs to environments
	if (config.tabs.length > 0 && config.environments.length === 0) {
		const envId = newId();

		config.environments.push({
			id: envId,
			name: 'Default',
			connection: {}
		})

		config.tabs.forEach(tab => {
			tab.environment = envId;
		});
	}
}