import { getHotkeyHandler } from "@mantine/hooks";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Menu, MenuItem, PredefinedMenuItem, Submenu } from "@tauri-apps/api/menu";
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
import { VIEW_PAGES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import type { AppMenu, AppMenuItem, Platform, QueryTab, SurrealistConfig, ViewPage } from "~/types";
import { getSetting, watchStore } from "~/util/config";
import { getConnection } from "~/util/connection";
import { featureFlags } from "~/util/feature-flags";
import { NavigateViewEvent } from "~/util/global-events";
import { optional, showErrorNotification, showInfo } from "~/util/helpers";
import { dispatchIntent, handleIntentRequest } from "~/util/intents";
import { adapter } from ".";
import type { OpenedBinaryFile, OpenedTextFile, SurrealistAdapter } from "./base";

const WAIT_DURATION = 1000;
const SEPARATOR: AppMenuItem = {
	id: "separator",
	type: "Separator",
};

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
	public isTelemetryEnabled = true;
	public titlebarOffset = 0;
	public platform: Platform = "windows";
	public menuList: AppMenu[] | undefined = undefined;

	#startTask: any;
	#arch: string = arch();
	#system: string = type();

	public constructor() {
		this.initDatabaseEvents();
		this.initWindowEvents();

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

		getCurrentWindow().onFocusChanged(async () => {
			if (this.platform === "darwin") {
				await this.setupWindowMenu();
			}
		});

		getCurrentWindow().listen("open-resource", () => {
			this.queryOpenRequest();
		});

		getCurrentWindow().listen("tauri://focus", () => {
			this.checkForUpdates();
		});
	}

	public async initialize() {
		await attachConsole();

		this.queryOpenRequest();
		this.checkForUpdates();

		this.menuList = this.computeMenuItems();

		if (this.platform === "darwin") {
			await this.setupWindowMenu();
			this.titlebarOffset = 15;
		} else {
			this.titlebarOffset = 32;
		}

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

	public dumpDebug = () => ({
		Platform: "Desktop",
		OS: this.#system,
		Architecture: this.#arch,
		WebView: navigator.userAgent,
	});

	public async setWindowTitle(title: string) {
		getCurrentWindow().setTitle(title || "Surrealist");
	}

	public computeMenuItems(): AppMenu[] {
		const isDarwin = this.platform === "darwin";

		const about: AppMenuItem = {
			id: "about",
			type: "Custom",
			name: "About Surrealist",
			action: () => {
				dispatchIntent("open-settings", { tab: "about" });
			},
		};

		const settings: AppMenuItem = {
			id: "settings",
			type: "Custom",
			name: "Settings",
			action: () => {
				dispatchIntent("open-settings", { tab: "preferences" });
			},
		};

		const surrealistMenu: AppMenu = {
			id: "surrealist",
			name: "Surrealist",
			items: [
				about,
				SEPARATOR,
				settings,
				SEPARATOR,
				{
					id: "hide",
					type: "Hide",
				},
				{
					id: "hide_others",
					type: "HideOthers",
				},
				{
					id: "show_all",
					type: "ShowAll",
				},
				SEPARATOR,
				{
					id: "quit",
					type: "Quit",
					name: "Quit Surrealist",
				},
			],
		};

		const fileMenu: AppMenu = {
			id: "file",
			name: "File",
			items: [
				{
					id: "new_window",
					type: "Custom",
					name: "New Window",
					action: async () => {
						await invoke("new_window");
					},
				},
				{
					id: "new_connection",
					type: "Custom",
					name: "New Connection",
					action: async () => {
						dispatchIntent("new-connection");
					},
				},
				SEPARATOR,
				{
					id: "open_query",
					type: "Custom",
					name: "Open Query...",
					action: async () => {
						dispatchIntent("open-query-file");
					},
				},
				SEPARATOR,
				{
					id: "import_database",
					type: "Custom",
					name: "Import Database",
					action: async () => {
						dispatchIntent("import-database");
					},
				},
				{
					id: "export_database",
					type: "Custom",
					name: "Export Database",
					action: async () => {
						dispatchIntent("export-database");
					},
				},
				SEPARATOR,
				{
					id: "open_command_palette",
					type: "Custom",
					name: "Open Command Palette",
					action: async () => {
						dispatchIntent("open-command-palette");
					},
				},
				{
					id: "open_documentation_search",
					type: "Custom",
					name: "Open Documentation Search",
					action: async () => {
						dispatchIntent("open-documentation");
					},
				},
				{
					id: "open_connection_list",
					type: "Custom",
					name: "Open Connection List",
					action: async () => {
						dispatchIntent("open-connections");
					},
				},
				...optional(!isDarwin && [SEPARATOR, settings]),
				SEPARATOR,
				{
					id: "close_window",
					type: "Custom",
					name: "Close Window",
					action: async () => {
						await getCurrentWindow().close();
					},
				},
			],
		};

		const viewMenu: AppMenu = {
			id: "view",
			name: "View",
			items: [
				{
					id: "toggle_pinned",
					type: "Custom",
					name: "Toggle Pinned",
					action: async () => {
						dispatchIntent("toggle-pinned");
					},
				},
				SEPARATOR,
				{
					id: "window_zoom_in",
					type: "Custom",
					name: "Zoom In",
					action: async () => {
						dispatchIntent("increase-window-scale");
					},
				},
				{
					id: "window_zoom_out",
					type: "Custom",
					name: "Zoom Out",
					action: async () => {
						dispatchIntent("decrease-window-scale");
					},
				},
				SEPARATOR,
				{
					id: "editor_zoom_in",
					type: "Custom",
					name: "Zoom In Editors",
					action: async () => {
						dispatchIntent("increase-editor-scale");
					},
				},
				{
					id: "editor_zoom_out",
					type: "Custom",
					name: "Zoom Out Editors",
					action: async () => {
						dispatchIntent("decrease-editor-scale");
					},
				},
				...optional(isDarwin && SEPARATOR),
			],
		};

		const helpMenu: AppMenu = {
			id: "help",
			name: "Help",
			items: [
				{
					id: "discord",
					type: "Custom",
					name: "Discord",
					action: () => {
						this.openUrl("https://discord.gg/surrealdb");
					},
				},
				{
					id: "github",
					type: "Custom",
					name: "GitHub",
					action: () => {
						this.openUrl("https://github.com/surrealdb");
					},
				},
				{
					id: "youtube",
					type: "Custom",
					name: "YouTube",
					action: () => {
						this.openUrl("https://www.youtube.com/@surrealdb");
					},
				},
				SEPARATOR,
				{
					id: "surrealdb_docs",
					type: "Custom",
					name: "SurrealDB Docs",
					action: () => {
						this.openUrl("https://surrealdb.com/docs/surrealdb");
					},
				},
				{
					id: "surrealist_docs",
					type: "Custom",
					name: "Surrealist Docs",
					action: () => {
						this.openUrl("https://surrealdb.com/docs/surrealist");
					},
				},
				SEPARATOR,
				{
					id: "fundamentals",
					type: "Custom",
					name: "Fundamentals Course",
					action: () => {
						this.openUrl("https://surrealdb.com/learn/fundamentals");
					},
				},
				{
					id: "book",
					type: "Custom",
					name: "Book",
					action: () => {
						this.openUrl("https://surrealdb.com/learn/book");
					},
				},
				SEPARATOR,
				{
					id: "report_issue",
					type: "Custom",
					name: "Report Issue",
					action: () => {
						this.openUrl("https://github.com/surrealdb/surrealist/issues/new/choose");
					},
				},
				...optional(!isDarwin && about),
			],
		};

		return [...optional(isDarwin && surrealistMenu), fileMenu, viewMenu, helpMenu];
	}

	public async setupWindowMenu() {
		const appMenu = await Menu.new({
			id: getCurrentWindow().label,
		});

		for (const menu of this.menuList || []) {
			const menuItems = [];

			for (const item of menu.items) {
				if (item.type !== "Custom") {
					const predefined = await PredefinedMenuItem.new({
						item: item.type,
					});

					menuItems.push(predefined);
					continue;
				}

				const custom = await MenuItem.new({
					id: item.id,
					text: item.name ?? "Unnamed",
					enabled: !item.disabled,
					action: item.action,
				});

				menuItems.push(custom);
			}

			const submenu = await Submenu.new({
				id: menu.id,
				text: menu.name,
				items: menuItems,
			});

			appMenu.append(submenu);
		}

		await appMenu.setAsAppMenu();
	}

	public async loadConfig() {
		switch (type()) {
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
			throw new Error("File is empty");
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
			self: undefined,
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

			showErrorNotification({
				title: "Serving failed",
				content: msg,
			});
		});
	}

	private initWindowEvents() {
		getCurrentWindow().listen("window:open_settings", (e) =>
			dispatchIntent("open-settings", e.payload ? { tab: e.payload as string } : undefined),
		);
	}

	private async queryOpenRequest() {
		const { addQueryTab, setActiveQueryTab } = useConfigStore.getState();
		const resources = await invoke<Resource[]>("get_opened_resources");

		if (resources.length === 0) {
			return;
		}

		for (const { File, Link } of resources) {
			if (File) {
				const { success, name, path } = File;

				if (!success) {
					showErrorNotification({
						title: `Failed to open "${name}"`,
						content: `File exceeds maximum size limit`,
					});

					continue;
				}

				const connection = getConnection();

				if (!connection) {
					showInfo({
						title: "Connection required",
						subtitle: "Please open a connection before opening files",
					});
					return;
				}

				const existing = connection.queries.find(
					(q) => q.type === "file" && q.query === path,
				);

				if (existing) {
					setActiveQueryTab(connection.id, existing.id);
				} else {
					addQueryTab(connection.id, { type: "file", name: name, query: path });
				}

				NavigateViewEvent.dispatch("query");
				await invoke("clear_opened_resources");
			} else if (Link) {
				const { host, params } = Link;

				if (host) {
					const views = Object.keys(VIEW_PAGES) as ViewPage[];
					const target = views.find((v) => host === v);

					if (target) {
						NavigateViewEvent.dispatch(target);
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

				await invoke("clear_opened_resources");
			}
		}
	}

	public async trackEvent(url: string): Promise<void> {
		const stripCookie = (cookie: string) =>
			cookie
				.split(";")
				.map((c) => c.trim())
				.filter(
					(c) =>
						!c.startsWith("HttpOnly") &&
						!c.startsWith("Secure") &&
						!c.startsWith("Domain"),
				)
				.join("; ");

		const { gtm_debug } = featureFlags.store;
		const previewHeader = getSetting("gtm", "preview_header");

		try {
			const cookies = await invoke<Promise<string[]>>("track_event", {
				url,
				cookie: document.cookie,
				userAgent: navigator.userAgent,
				previewHeader: (gtm_debug && previewHeader) || undefined,
			});

			for (const cookie of cookies) {
				document.cookie = stripCookie(cookie);
			}
		} catch (err) {
			console.error("Failed to track event: ", err);
		}
	}
}
