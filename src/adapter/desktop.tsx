import { getHotkeyHandler } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { basename } from "@tauri-apps/api/path";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readFile, readTextFile, writeFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { attachConsole, info, trace, warn } from "@tauri-apps/plugin-log";
import { arch, type } from "@tauri-apps/plugin-os";
import { open as openURL } from "@tauri-apps/plugin-shell";
import { check } from "@tauri-apps/plugin-updater";
import { compareVersions } from "compare-versions";
import { VIEW_MODES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import type { Platform, QueryTab, SurrealistConfig, ViewMode } from "~/types";
import { getSetting, watchStore } from "~/util/config";
import { getActiveConnection } from "~/util/connection";
import { featureFlags } from "~/util/feature-flags";
import { showError, showInfo } from "~/util/helpers";
import { handleIntentRequest } from "~/util/intents";
import { adapter } from ".";
import type { OpenedBinaryFile, OpenedTextFile, SurrealistAdapter } from "./base";

const WAIT_DURATION = 1000;

interface Resource {
	File?: FileResource;
	Link?: LinkResource;
}

interface FileResource {
	success: boolean;
	name: string;
	path: string;
}

interface LinkResource {
	host: string;
	params: string;
}

/**
 * Surrealist adapter for running as Wails desktop app
 */
export class DesktopAdapter implements SurrealistAdapter {
	public readonly id: string = "desktop";

	public isServeSupported = true;
	public isUpdateCheckSupported = true;
	public hasTitlebar = false;
	public platform: Platform = "windows";

	#startTask: any;
	#arch: string = arch();
	#system: string = type();

	public constructor() {
		this.hasTitlebar = this.#system === "windows" || this.#system === "linux";

		this.initDatabaseEvents();

		document.addEventListener("DOMContentLoaded", () => {
			setTimeout(() => {
				getCurrentWindow().show();
			}, 500);
		});

		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
		});

		document.body.addEventListener(
			"keydown",
			getHotkeyHandler([["mod+alt+i", () => invoke("toggle_devtools")]]),
		);

		listen("open-resource", () => {
			this.queryOpenRequest();
		});

		listen("tauri://focus", () => {
			this.checkForUpdates();
		});
	}

	public async initialize() {
		await attachConsole();

		this.queryOpenRequest();
		this.checkForUpdates();

		watchStore({
			initial: true,
			store: useConfigStore,
			select: (s) => s.settings.appearance.windowScale,
			then: (scale) => getCurrentWebview().setZoom(scale / 100),
		});

		watchStore({
			initial: true,
			store: useConfigStore,
			select: (s) => s.settings.behavior.windowPinned,
			then: (pinned) => {
				console.log("pinned", pinned);
				getCurrentWindow().setAlwaysOnTop(pinned);
			},
		});
	}

	public dumpDebug = async () => ({
		Platform: "Desktop",
		OS: this.#system,
		Architecture: this.#arch,
		WebView: navigator.userAgent,
	});

	public async setWindowTitle(title: string) {
		getCurrentWindow().setTitle(title || "Surrealist");
	}

	public async loadConfig() {
		switch (await type()) {
			case "windows": {
				this.platform = "windows";
				break;
			}
			case "macos": {
				this.platform = "darwin";
				break;
			}
			case "linux": {
				this.platform = "linux";
				break;
			}
		}

		const config = await invoke<string>("load_config");

		return JSON.parse(config);
	}

	public async processConfig(config: SurrealistConfig) {
		return config;
	}

	public saveConfig(config: SurrealistConfig) {
		return invoke<void>("save_config", {
			config: JSON.stringify(config),
		});
	}

	public async startDatabase() {
		const { username, password, port, driver, storage, executable, logLevel } =
			useConfigStore.getState().settings.serving;

		const legacyCompat = featureFlags.get("legacy_serve");

		return invoke<void>("start_database", {
			username,
			password,
			port,
			driver,
			storage,
			executable,
			logLevel,
			legacyCompat,
		});
	}

	public stopDatabase() {
		return invoke<void>("stop_database");
	}

	public async openUrl(url: string) {
		openURL(url);
	}

	public async saveFile(
		title: string,
		defaultPath: string,
		filters: any,
		content: () => Result<string | Blob | null>,
	): Promise<boolean> {
		const filePath = await save({ title, defaultPath, filters });

		if (!filePath) {
			return false;
		}

		const result = await content();

		if (!result) {
			return false;
		}

		if (typeof result === "string") {
			await writeTextFile(filePath, result);
		} else {
			await writeFile(filePath, new Uint8Array(await result.arrayBuffer()));
		}

		return true;
	}

	public async openTextFile<M extends boolean>(
		title: string,
		filters: any,
		multiple: M,
	): Promise<OpenedTextFile[]> {
		const result = await open({
			title,
			filters,
			multiple,
		});

		if (!result) {
			return [];
		}

		const files: string[] = Array.isArray(result) ? result : [result];
		const tasks = files.map(async (path) => ({
			name: await basename(path),
			content: await readTextFile(path),
		}));

		return Promise.all(tasks);
	}

	public async openBinaryFile<M extends boolean>(
		title: string,
		filters: any,
		multiple: M,
	): Promise<OpenedBinaryFile[]> {
		const result = await open({
			title,
			filters,
			multiple,
		});

		if (!result) {
			return [];
		}

		const files: string[] = Array.isArray(result) ? result : [result];
		const tasks = files.map(async (path) => ({
			name: await basename(path),
			content: new Blob([await readFile(path)]),
		}));

		return Promise.all(tasks);
	}

	public toggleDevTools() {
		invoke("toggle_devtools");
	}

	public log(label: string, message: string) {
		info(`${label}: ${message}`);
	}

	public warn(label: string, message: string) {
		warn(`${label}: ${message}`);
	}

	public trace(label: string, message: string) {
		trace(`${label}: ${message}`);
	}

	public fetch(url: string, options?: RequestInit | undefined): Promise<Response> {
		return fetch(url, options);
	}

	public async checkForUpdates(force?: boolean) {
		const { lastPromptedVersion, setLastPromptedVersion } = useConfigStore.getState();
		const { setAvailableUpdate } = useInterfaceStore.getState();

		adapter.log("Updater", "Checking for updates");

		try {
			const result = await check();

			if (result) {
				const currentVersion = import.meta.env.VERSION;
				const latestVersion = result.version;

				adapter.log("Updater", `Current: ${currentVersion}, Latest: ${latestVersion}`);

				if (compareVersions(latestVersion, currentVersion) > 0) {
					const showAlert = force || result.version !== lastPromptedVersion;

					setAvailableUpdate(result, showAlert);
					setLastPromptedVersion(result.version);
				}
			} else {
				adapter.log("Updater", "No updates available");
			}
		} catch (err: any) {
			console.warn("Failed to check for updates", err);
		}
	}

	public readQueryFile(query: QueryTab) {
		return invoke<string>("read_query_file", { path: query.query });
	}

	public writeQueryFile(query: QueryTab, content: string) {
		return invoke<void>("write_query_file", { path: query.query, content });
	}

	public openQueryFile() {
		return invoke<string>("open_query_file");
	}

	public openInExplorer(query: QueryTab) {
		return invoke<void>("open_in_explorer", { path: query.query });
	}

	public pruneQueryFiles() {
		const { sandbox, connections } = useConfigStore.getState();
		const paths = [sandbox, ...connections]
			.flatMap((c) => c.queries)
			.filter((q) => q.type === "file")
			.map((q) => q.query);

		return invoke<void>("prune_allowed_files", { paths });
	}

	private initDatabaseEvents() {
		let throttleLevel = 0;

		setInterval(() => {
			throttleLevel = Math.max(0, throttleLevel - 1);
		}, 500);

		listen("database:start", () => {
			this.log("Serve", "Received database start signal");

			this.#startTask = setTimeout(() => {
				useDatabaseStore.getState().confirmServing();

				showInfo({
					title: "Serving started",
					subtitle: "Local database is now online",
				});
			}, WAIT_DURATION);
		});

		listen("database:stop", () => {
			this.log("Serve", "Received database stop signal");

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			useDatabaseStore.getState().stopServing();

			showInfo({
				title: "Serving stopped",
				subtitle: "Local database is now offline",
			});
		});

		listen("database:output", (event) => {
			if (throttleLevel > 50) {
				return;
			}

			const historySize = getSetting("serving", "historySize");

			useDatabaseStore.getState().pushConsoleLine(event.payload as string, historySize);
			throttleLevel++;
		});

		listen("database:error", (event) => {
			this.log("Serve", "Received database error signal");

			const msg = event.payload as string;

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			useDatabaseStore.getState().stopServing();

			showError({
				title: "Serving failed",
				subtitle: msg,
			});
		});
	}

	private async queryOpenRequest() {
		const { addQueryTab, setActiveQueryTab, setActiveView } = useConfigStore.getState();
		const resources = await invoke<Resource[]>("get_opened_resources");
		const connection = getActiveConnection();

		if (resources.length === 0) {
			return;
		}

		for (const { File, Link } of resources) {
			if (File) {
				const { success, name, path } = File;

				if (!success) {
					showError({
						title: `Failed to open "${name}"`,
						subtitle: `File exceeds maximum size limit`,
					});

					continue;
				}

				const existing = connection.queries.find(
					(q) => q.type === "file" && q.query === path,
				);

				if (existing) {
					setActiveQueryTab(existing.id);
				} else {
					addQueryTab({ type: "file", name: name, query: path });
				}

				setActiveView("query");
			} else if (Link) {
				const { host, params } = Link;

				if (host) {
					const views = Object.keys(VIEW_MODES) as ViewMode[];
					const target = views.find((v) => host === v);

					if (target) {
						setActiveView(target);
					}
				}

				if (params) {
					const search = new URLSearchParams(params);
					const intent = search.get("intent");

					if (intent) {
						setTimeout(() => {
							handleIntentRequest(intent);
						});
					}
				}
			}
		}
	}
}
