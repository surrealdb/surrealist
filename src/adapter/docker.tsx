import * as v from "valibot";
import { INSTANCE_CONFIG } from "~/constants";
import { type InstanceConfig, InstanceConfigSchema } from "~/schemas";
import type { SurrealistConfig } from "~/types";
import { showError } from "~/util/helpers";
import { BrowserAdapter } from "./browser";
import { createBaseAuthentication, createBaseConnection } from "~/util/defaults";

/**
 * Base adapter for running as docker image
 */
export class DockerAdapter extends BrowserAdapter {
	public readonly id: string = "docker";

	public async processConfig(config: SurrealistConfig) {
		this.log("Adapter", "Fetching instance config");

		const instanceConfigJson = await this.fetchInstanceConfig();

		if (!instanceConfigJson) {
			return config;
		}

		try {
			const instanceConfig = v.parse(InstanceConfigSchema, instanceConfigJson);
			const uniqueIds = new Set<string>();

			this.isTelemetryEnabled = instanceConfig.telemetry ?? true;

			for (const con of instanceConfig.connections) {
				if (uniqueIds.has(con.id)) {
					throw new Error(`Duplicate connection ID: ${con.id}`);
				}

				uniqueIds.add(con.id);
			}

			this.log("Adapter", "Applying instance config");

			return this.applyInstanceConfig(config, instanceConfig);
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
		const { connections } = instanceConfig;

		// Synchronize connections
		for (const con of connections) {
			let connection = config.connections.find((c) => c.id === con.id);

			if (!connection) {
				connection = createBaseConnection(config.settings);
				connection.id = con.id;
				config.connections.push(connection);
			}

			connection.name = con.name;
			connection.instance = true;
			connection.authentication = {
				...createBaseAuthentication(),
				...con.authentication,
			};

			if (con.defaultNamespace) {
				connection.lastNamespace = con.defaultNamespace;

				if (con.defaultDatabase) {
					connection.lastDatabase = con.defaultDatabase;
				}
			}
		}

		// Remove previously managed connections
		config.connections = config.connections.filter(
			(c) => !c.instance || instanceConfig.connections.some((ic) => ic.id === c.id),
		);

		return config;
	}
}
