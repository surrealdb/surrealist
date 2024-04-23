import { readBinaryFile, readTextFile, writeBinaryFile, writeTextFile } from "@tauri-apps/api/fs";
import { invoke } from "@tauri-apps/api/tauri";
import { arch, type } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";
import { open as openURL } from "@tauri-apps/api/shell";
import { save, open } from "@tauri-apps/api/dialog";
import { basename } from "@tauri-apps/api/path";
import { listen } from "@tauri-apps/api/event";
import { OpenedBinaryFile, OpenedTextFile, SurrealistAdapter } from "./base";
import { printLog, showError, showInfo, updateTitle } from "~/util/helpers";
import { useDatabaseStore } from "~/stores/database";
import { useConfigStore } from "~/stores/config";
import { watchStore } from "~/util/config";
import { Platform } from "~/types";
import { getHotkeyHandler } from "@mantine/hooks";

const WAIT_DURATION = 1000;

const printMsg = (...args: any[]) => printLog("Desktop", "#9150e6", ...args);

/**
 * Surrealist adapter for running as Wails desktop app
 */
export class DesktopAdapter implements SurrealistAdapter {

	public isServeSupported = true;
	public isUpdateCheckSupported = true;
	public hasTitlebar = false;
	public platform: Platform = "windows";

	#startTask: any;

	public constructor() {
		this.initDatabaseEvents();

		document.addEventListener("DOMContentLoaded", () => {
			setTimeout(() => {
				appWindow.show();
			}, 500);
		});

		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
		});

		document.body.addEventListener("keydown", getHotkeyHandler([
			["mod+alt+i", () => invoke("toggle_devtools")]
		]));

		type().then(t => {
			this.hasTitlebar = t === "Windows_NT" || t === "Linux";
		});
	}

	public initialize() {
		watchStore({
			initial: true,
			store: useConfigStore,
			select: (s) => s.settings.appearance.windowScale,
			then: (scale) => invoke<void>("set_window_scale", { scaleFactor: scale / 100 }),
		});

		watchStore({
			initial: true,
			store: useConfigStore,
			select: (s) => s.settings.behavior.windowPinned,
			then: (pinned) => {
				appWindow.setAlwaysOnTop(pinned);
				updateTitle();
			},
		});
	}

	public dumpDebug = async () => ({
		"Platform": "Desktop",
		"OS": await type(),
		"Architecture": await arch(),
		"WebView": navigator.userAgent,
	});

	public async setWindowTitle(title: string) {
		appWindow.setTitle(title || "Surrealist");
	}

	public async loadConfig() {
		switch (await type()) {
			case "Windows_NT": {
				this.platform = "windows";
				break;
			}
			case "Darwin": {
				this.platform = "darwin";
				break;
			}
			case "Linux": {
				this.platform = "linux";
				break;
			}
		}

		const config = await invoke<string>("load_config");

		return JSON.parse(config);
	}

	public saveConfig(config: string) {
		return invoke<void>("save_config", {
			config: JSON.stringify(config)
		});
	}

	public async hasLegacyConfig() {
		return invoke<boolean>("has_legacy_config");
	}

	public async getLegacyConfig() {
		const config = await invoke<string>("load_legacy_config");

		return JSON.parse(config);
	}

	public async handleLegacyCleanup() {
		return invoke<void>("complete_legacy_migrate");
	}

	public async startDatabase(
		username: string,
		password: string,
		port: number,
		localDriver: string,
		localPath: string,
		surrealPath: string
	) {
		return invoke<void>("start_database", {
			username: username,
			password: password,
			port: port,
			driver: localDriver,
			storage: localPath,
			executable: surrealPath,
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
		content: () => Result<string | Blob | null>
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
			await writeBinaryFile(filePath, await result.arrayBuffer());
		}

		return true;
	}

	public async openTextFile(
		title: string,
		filters: any,
		multiple: boolean
	): Promise<OpenedTextFile[]> {
		const result = await open({
			title,
			filters,
			multiple
		});

		const urls = typeof result === "string"
			? [result]
			: result === null
				? []
				: result;

		const tasks = urls.map(async (url) => ({
			name: await basename(url),
			content: await readTextFile(url)
		}));

		return Promise.all(tasks);
	}

	public async openBinaryFile(
		title: string,
		filters: any,
		multiple: boolean
	): Promise<OpenedBinaryFile[]> {
		const result = await open({
			title,
			filters,
			multiple
		});

		const urls = typeof result === "string"
			? [result]
			: result === null
				? []
				: result;

		const tasks = urls.map(async (url) => ({
			name: await basename(url),
			content: new Blob([await readBinaryFile(url)])
		}));

		return Promise.all(tasks);
	}

	private initDatabaseEvents() {
		listen("database:start", () => {
			printMsg("Received database start signal");

			this.#startTask = setTimeout(() => {
				useDatabaseStore.getState().confirmServing();

				showInfo({
					title: "Serving started",
					subtitle: "Local database is now online"
				});
			}, WAIT_DURATION);
		});

		listen("database:stop", () => {
			printMsg("Received database stop signal");

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			useDatabaseStore.getState().stopServing();

			showInfo({
				title: "Serving stopped",
				subtitle: "Local database is now offline"
			});
		});

		listen("database:output", (event) => {
			useDatabaseStore.getState().pushConsoleLine(event.payload as string);
		});

		listen("database:error", (event) => {
			printMsg("Received database error signal");

			const msg = event.payload as string;

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			useDatabaseStore.getState().stopServing();

			showError({
				title: "Serving failed",
				subtitle: msg
			});
		});
	}
}
