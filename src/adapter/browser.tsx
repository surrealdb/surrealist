import type {
	Connection,
	Platform,
	SurrealistConfig,
	UrlTarget,
} from "~/types";
import type {
	OpenedBinaryFile,
	OpenedTextFile,
	SurrealistAdapter,
} from "./base";

/**
 * Surrealist adapter for running as web app
 */
export class BrowserAdapter implements SurrealistAdapter {
	public id = "browser";

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
		const config = localStorage.getItem("surrealist:config") || "{}";
		const parsed = JSON.parse(config);

		if (
			parsed.configVersion === undefined &&
			Object.keys(parsed).length > 0
		) {
			return {};
		}

		if (import.meta.env.IS_EMBEDDED && Object.keys(parsed).length === 0) {
			return await this.loadEmbeddedConfig();
		}

		return parsed;
	}

	private async loadEmbeddedConfig(): Promise<Partial<SurrealistConfig>> {
		const response = await this.fetch("/servers.json");
		const result = await response.json();

		const v = await import("valibot");
		const { SurrealistEmbeddedConfigSchema } = await import(
			"~/types.validated"
		);

		const { activeConnection, connections: partialConnections } = v.parse(
			SurrealistEmbeddedConfigSchema,
			result
		);

		const connections = partialConnections as Partial<Connection>[];

		const isValidActiveConnection = (connections as any[])
			.map((c) => c.id)
			.includes(activeConnection);

		// set last namespace and database to be the default connection
		for (const con of connections) {
			con.lastNamespace = con.authentication?.namespace;
			con.lastDatabase = con.authentication?.database;
		}

		return {
			activeConnection,
			connections: connections as Connection[],
			activeScreen: isValidActiveConnection ? "database" : "start",
		};
	}

	public async saveConfig(config: any) {
		localStorage.setItem("surrealist:config", JSON.stringify(config));
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
		content: () => Result<string | Blob | null>
	): Promise<boolean> {
		const result = await content();

		if (!result) {
			return false;
		}

		const file =
			typeof result === "string"
				? new File([result], "", { type: "text/plain" })
				: result;

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

	public fetch(
		url: string,
		options?: RequestInit | undefined
	): Promise<Response> {
		return fetch(url, options);
	}
}
