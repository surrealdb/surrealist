import * as v from "valibot";
import { INSTANCE_CONFIG } from "~/constants";
import { type InstanceConfig, InstanceConfigSchema } from "~/schemas";
import type { SurrealistConfig } from "~/types";
import { isDevelopment } from "~/util/environment";
import { showError } from "~/util/helpers";
import { BrowserAdapter } from "./browser";

/**
 * Base adapter for running as docker image
 */
export class DockerAdapter extends BrowserAdapter {
	public readonly id: string = "docker";

	public async processConfig(config: SurrealistConfig) {
		if (!import.meta.env.VITE_SURREALIST_DOCKER && !isDevelopment) {
			return config;
		}

		this.log("Adapter", "Fetching instance config");

		const instanceConfig = await this.fetchInstanceConfig();

		if (!instanceConfig) {
			return config;
		}

		try {
			const parsed = v.parse(InstanceConfigSchema, instanceConfig);
			const ids = new Set<string>();

			for (const con of parsed.connections) {
				if (ids.has(con.id)) {
					throw new Error(`Duplicate connection ID: ${con.id}`);
				}

				ids.add(con.id);
			}

			this.log("Adapter", "Applying instance config");

			return this.applyInstanceConfig(config, parsed);
		} catch (err: any) {
			console.warn(err);

			showError({
				title: "Failed to parse instance config",
				subtitle: `The file "${INSTANCE_CONFIG}" is incorrectly configured`,
			});

			return config;
		}
	}

	private async fetchInstanceConfig() {
		try {
			return await this.fetch(`/${INSTANCE_CONFIG}`).then((res) => res.json());
		} catch {
			return null;
		}
	}

	private applyInstanceConfig(config: SurrealistConfig, instanceConfig: InstanceConfig) {
		// // nothing configured in the instance file
		// // clean instance connections
		// if (instanceConfig.connections.length <= 0) {
		// 	config.connectionGroups = config.connectionGroups.filter(
		// 		(group) => group.id !== INSTANCE_GROUP,
		// 	);
		// 	config.connections = config.connections.filter(
		// 		(connection) => connection.group !== INSTANCE_GROUP,
		// 	);

		// 	return config;
		// }

		// // sync connection groups
		// const existingConnectionGroup = config.connectionGroups.find(
		// 	(group) => group.id === INSTANCE_GROUP,
		// );

		// if (existingConnectionGroup) {
		// 	existingConnectionGroup.name = instanceConfig.groupName;
		// 	existingConnectionGroup.collapsed = instanceConfig.groupCollapsed;
		// } else {
		// 	config.connectionGroups.push({
		// 		id: INSTANCE_GROUP,
		// 		name: instanceConfig.groupName,
		// 		collapsed: instanceConfig.groupCollapsed,
		// 	});
		// }

		// // Add missing connections
		// for (const con of instanceConfig.connections) {
		// 	const existingConnection = config.connections.find((c) => c.id === con.id);

		// 	if (existingConnection) {
		// 		continue;
		// 	}

		// 	const newConnection = createBaseConnection(config.settings);

		// 	newConnection.id = con.id;
		// 	newConnection.name = con.name;
		// 	newConnection.group = INSTANCE_GROUP;
		// 	newConnection.authentication = con.authentication as Authentication;

		// 	if (con.defaultNamespace) {
		// 		newConnection.lastNamespace = con.defaultNamespace;

		// 		if (con.defaultDatabase) {
		// 			newConnection.lastDatabase = con.defaultDatabase;
		// 		}
		// 	}

		// 	config.connections.push(newConnection);
		// }

		// // Remove connections that are not in the instance config
		// config.connections = config.connections.filter(
		// 	(c) =>
		// 		c.group !== INSTANCE_GROUP ||
		// 		instanceConfig.connections.some((ic) => ic.id === c.id),
		// );

		// const isValidActiveConnection = config.connections.some(
		// 	(c) => c.id === instanceConfig.defaultConnection,
		// );

		// // Change activeConnection if instance config is valid
		// // FIXME navigate to connection
		// // if (isValidActiveConnection) {
		// // 	config.activeConnection = instanceConfig.defaultConnection ?? "";
		// // }

		return config;
	}
}
