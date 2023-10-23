import { invoke } from "@tauri-apps/api/tauri";
import { appWindow } from "@tauri-apps/api/window";
import { open as openURL } from "@tauri-apps/api/shell";
import { save, open } from "@tauri-apps/api/dialog";
import { listen } from "@tauri-apps/api/event";
import { Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { store } from "~/store";
import { SurrealistAdapter } from "./base";
import { printLog } from "~/util/helpers";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { Result } from "~/typings/utilities";
import { confirmServing, pushConsoleLine, stopServing } from "~/stores/database";

const WAIT_DURATION = 1000;

/**
 * Surrealist adapter for running as Wails desktop app
 */
export class DesktopAdapter implements SurrealistAdapter {

	public isServeSupported = true;
	public isPinningSupported = true;
	public isUpdateCheckSupported = true;
	public isPromotionSupported = false;

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
	}

	public async setWindowTitle(title: string) {
		appWindow.setTitle(title || "Surrealist");
	}

	public loadConfig() {
		return invoke<string>("load_config");
	}

	public saveConfig(config: string) {
		return invoke<void>("save_config", {
			config,
		});
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

	public async setWindowPinned(value: boolean) {
		appWindow.setAlwaysOnTop(value);
	}

	public async openUrl(url: string) {
		openURL(url);
	}

	public async saveFile(
		title: string,
		defaultPath: string,
		filters: any,
		content: () => Result<string>
	): Promise<boolean> {
		const filePath = await save({ title, defaultPath, filters });
	
		if (!filePath) {
			return false;
		}
	
		await writeTextFile(filePath, await content());

		return true;
	}

	public async openFile(
		title: string,
		filters: any,
		multiple: boolean
	): Promise<string | null> {
		const url = await open({
			title,
			filters,
			multiple
		});

		if (!url) {
			return null;
		}

		return readTextFile(url as string);
	}

	private initDatabaseEvents() {
		listen("database:start", () => {
			printLog("Runner", "#f2415f", "Received database start signal");

			this.#startTask = setTimeout(() => {
				store.dispatch(confirmServing());

				showNotification({
					autoClose: 1500,
					color: "green.6",
					message: (
						<Stack spacing={0}>
							<Text weight={600}>Database started</Text>
							<Text color="light.5">Local database is now online</Text>
						</Stack>
					),
				});
			}, WAIT_DURATION);
		});

		listen("database:stop", () => {
			printLog("Runner", "#f2415f", "Received database stop signal");

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			store.dispatch(stopServing());

			showNotification({
				autoClose: 1500,
				color: "red.6",
				message: (
					<Stack spacing={0}>
						<Text weight={600}>Database stopped</Text>
						<Text color="light.5">Local database is now offline</Text>
					</Stack>
				),
			});
		});

		listen("database:output", (event) => {
			store.dispatch(pushConsoleLine(event.payload as string));
		});

		listen("database:error", (event) => {
			printLog("Runner", "#f2415f", "Received database error signal");

			const msg = event.payload as string;

			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}

			store.dispatch(stopServing());

			showNotification({
				color: "red.6",
				message: (
					<Stack spacing={0}>
						<Text weight={600}>Failed to start database</Text>
						<Text color="light.5">{msg}</Text>
					</Stack>
				),
			});
		});
	}
}
