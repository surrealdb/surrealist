import type { Authentication, SurrealistConfig } from "~/types";
import type { SurrealistEmbeddedConfig } from "~/types.validated";
import { createBaseConnection } from "./defaults";

const embeddedGroupId = "embedded";

export const syncEmbeddedConfig = (
	config: SurrealistConfig,
	embeddedConfig: SurrealistEmbeddedConfig,
): SurrealistConfig => {
	if (embeddedConfig.connections.length <= 0) {
		// nothing configured in the embedded file
		// clean embedded connections
		config.connectionGroups = config.connectionGroups.filter(
			(group) => group.id !== embeddedGroupId,
		);
		config.connections = config.connections.filter(
			(connection) => connection.group !== embeddedGroupId,
		);

		return config;
	}

	// sync connection groups
	const existingConnectionGroup = config.connectionGroups.find(
		(group) => group.id === embeddedGroupId,
	);
	if (existingConnectionGroup) {
		existingConnectionGroup.name = embeddedConfig.groupName;
	} else {
		config.connectionGroups.push({
			id: embeddedGroupId,
			name: embeddedConfig.groupName,
			editable: false,
		});
	}

	// sync connections for the embedded group
	for (const con of embeddedConfig.connections) {
		const existingConnection = config.connections.find((c) => c.id === con.id);
		if (existingConnection) {
			continue;
		}

		const newConnection = createBaseConnection(config.settings);

		newConnection.id = con.id;
		newConnection.name = con.name;
		newConnection.group = embeddedGroupId;
		newConnection.authentication = con.authentication as Authentication;
		newConnection.lastNamespace = con.authentication?.namespace ?? newConnection.lastNamespace;
		newConnection.lastDatabase = con.authentication?.database ?? newConnection.lastDatabase;

		config.connections.push(newConnection);
	}

	// change activeScreen if embedded config is valid
	const isValidActiveConnection = config.connections.some(
		(c) => c.id === embeddedConfig.defaultConnection,
	);

	if (isValidActiveConnection && config.activeScreen === "start") {
		config.activeScreen = "database";
	}

	return config;
};
