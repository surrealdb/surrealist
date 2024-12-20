import { isFunction, shake } from "radash";
import * as v from "valibot";
import { INSTANCE_CONFIG, INSTANCE_GROUP } from "~/constants";
import { type InstanceConfig, InstanceConfigSchema } from "~/schemas";
import type { Authentication, Platform, SurrealistConfig, UrlTarget } from "~/types";
import { createBaseConnection } from "~/util/defaults";
import { isDevelopment } from "~/util/environment";
import { showError } from "~/util/helpers";
import * as idxdb from "~/util/idxdb";
import { CONFIG_KEY } from "~/util/storage";
import type { OpenedBinaryFile, OpenedTextFile, SurrealistAdapter } from "./base";

/**
 * Base adapter for running as web app
 */
export class BrowserAdapter implements SurrealistAdapter {
	public readonly id: string = "browser";

	public isServeSupported = false;
	public isUpdateCheckSupported = false;
	public hasTitlebar = true;
	public platform: Platform = "windows";

	public initialize() {
		const platform = navigator.platform.toLowerCase();

		if (platform.includes("win")) {
			this.platform = "windows";
		} else if (platform.includes("mac") || platform.includes("darwin")) {
			this.platform = "darwin";
		} else if (platform.includes("linux")) {
			this.platform = "linux";
		}
	}

	public dumpDebug = () => ({
		Platform: "Web",
		Navigator: navigator.userAgent,
	});

	public async setWindowTitle(title: string) {
		document.title = title;
	}

	public async loadConfig() {
		const localStorageValue = localStorage.getItem(CONFIG_KEY);

		// NOTE legacy local storage config
		if (localStorageValue) {
			const config = localStorageValue || "{}";
			const parsed = JSON.parse(config);

			if (parsed.configVersion === undefined && Object.keys(parsed).length > 0) {
				return {};
			}

			return parsed;
		}

		return (await idxdb.getConfig()) || {};
	}

	public async processConfig(config: SurrealistConfig) {
		if (!import.meta.env.VITE_SURREALIST_INSTANCE && !isDevelopment) {
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

	public async saveConfig(config: SurrealistConfig) {
		await idxdb.setConfig(shake(config, isFunction));
		localStorage.removeItem(CONFIG_KEY);
	}

	public async startDatabase() {
		throw new Error("Not supported");
	}

	public async stopDatabase() {
		throw new Error("Not supported");
	}

	public async openUrl(url: string, target?: UrlTarget) {
		window.open(url, target === "internal" ? "_self" : "_blank");
	}

	public async saveFile(
		_title: string,
		defaultPath: string,
		_filters: any,
		content: () => Result<string | Blob>,
	): Promise<boolean> {
		const result = await content();

		if (!result) {
			throw new Error("File is empty");
		}

		const file =
			typeof result === "string" ? new File([result], "", { type: "text/plain" }) : result;

		const url = window.URL.createObjectURL(file);
		const el = document.createElement("a");

		el.style.display = "none";
		document.body.append(el);

		el.href = url;
		el.download = defaultPath;
		el.click();

		window.URL.revokeObjectURL(url);
		el.remove();

		return true;
	}

	public async openTextFile(): Promise<OpenedTextFile[]> {
		const el = document.createElement("input");

		el.type = "file";
		el.style.display = "none";

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener("change", async () => {
				const files = [...(el.files ?? [])];
				const tasks = files.map(async (file) => ({
					name: file.name,
					content: await file.text(),
				}));

				const results = await Promise.all(tasks);

				resolve(results);
			});

			el.addEventListener("error", async () => {
				reject(new Error("Failed to read file"));
			});
		});
	}

	public async openBinaryFile(): Promise<OpenedBinaryFile[]> {
		const el = document.createElement("input");

		el.type = "file";
		el.style.display = "none";

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener("change", async () => {
				const files = [...(el.files ?? [])];
				const tasks = files.map(async (file) => ({
					name: file.name,
					content: file,
				}));

				const results = await Promise.all(tasks);

				resolve(results);
			});

			el.addEventListener("error", async () => {
				reject(new Error("Failed to read file"));
			});
		});
	}

	public log(label: string, message: string) {
		console.log(`${label}: ${message}`);
	}

	public warn(label: string, message: string) {
		console.warn(`${label}: ${message}`);
	}

	public trace(label: string, message: string) {
		console.debug(`${label}: ${message}`);
	}

	public fetch(url: string, options?: RequestInit | undefined): Promise<Response> {
		return fetch(url, options);
	}

	private async fetchInstanceConfig() {
		try {
			return await this.fetch(`/${INSTANCE_CONFIG}`).then((res) => res.json());
		} catch {
			return null;
		}
	}

	private applyInstanceConfig(config: SurrealistConfig, instanceConfig: InstanceConfig) {
		// nothing configured in the instance file
		// clean instance connections
		if (instanceConfig.connections.length <= 0) {
			config.connectionGroups = config.connectionGroups.filter(
				(group) => group.id !== INSTANCE_GROUP,
			);
			config.connections = config.connections.filter(
				(connection) => connection.group !== INSTANCE_GROUP,
			);

			return config;
		}

		// sync connection groups
		const existingConnectionGroup = config.connectionGroups.find(
			(group) => group.id === INSTANCE_GROUP,
		);

		if (existingConnectionGroup) {
			existingConnectionGroup.name = instanceConfig.groupName;
			existingConnectionGroup.collapsed = instanceConfig.groupCollapsed;
		} else {
			config.connectionGroups.push({
				id: INSTANCE_GROUP,
				name: instanceConfig.groupName,
				collapsed: instanceConfig.groupCollapsed,
			});
		}

		// Add missing connections
		for (const con of instanceConfig.connections) {
			const existingConnection = config.connections.find((c) => c.id === con.id);

			if (existingConnection) {
				continue;
			}

			const newConnection = createBaseConnection(config.settings);

			newConnection.id = con.id;
			newConnection.name = con.name;
			newConnection.group = INSTANCE_GROUP;
			newConnection.authentication = con.authentication as Authentication;

			if (con.defaultNamespace) {
				newConnection.lastNamespace = con.defaultNamespace;

				if (con.defaultDatabase) {
					newConnection.lastDatabase = con.defaultDatabase;
				}
			}

			config.connections.push(newConnection);
		}

		// Remove connections that are not in the instance config
		config.connections = config.connections.filter(
			(c) =>
				c.group !== INSTANCE_GROUP ||
				instanceConfig.connections.some((ic) => ic.id === c.id),
		);

		const isValidActiveConnection = config.connections.some(
			(c) => c.id === instanceConfig.defaultConnection,
		);

		// Change activeConnection if instance config is valid
		if (isValidActiveConnection) {
			config.activeConnection = instanceConfig.defaultConnection ?? "";
		}

		return config;
	}
}
