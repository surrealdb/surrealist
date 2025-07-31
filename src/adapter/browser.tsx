import { isFunction, shake } from "radash";
import type { Platform, SurrealistConfig, UrlTarget } from "~/types";
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
	public isTelemetryEnabled = true;
	public titlebarOffset = 0;
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
		return config;
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

	public async openTextFile(_: string, filters: any, __: boolean): Promise<OpenedTextFile[]> {
		const el = document.createElement("input");

		el.type = "file";
		el.accept = filters
			.map((f: any) => f.extensions.map((e: any) => `.${e}`).join(","))
			.join(",");
		el.style.display = "none";

		console.log(el.accept);

		el.click();

		return new Promise((resolve, reject) => {
			el.addEventListener("change", async () => {
				const files = [...(el.files ?? [])];
				const tasks = files.map(async (file) => ({
					name: file.name,
					content: await file.text(),
					self: file,
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

	public async trackEvent(url: string): Promise<void> {
		try {
			await fetch(url, {
				method: "POST",
				mode: "no-cors",
				credentials: "include",
				headers: {
					"Content-Type": "text/plain;charset=UTF-8",
				},
				body: "",
			});
		} catch (err: any) {
			console.error("Failed to track event: ", err);
		}
	}
}
