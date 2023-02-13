import { LoadConfig, SaveConfig, StartDatabase, StopDatabase, TogglePinned } from "$/go/backend/Surrealist";
import { BrowserOpenURL, WindowSetTitle, EventsOn } from "$/runtime/runtime";
import { Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { actions, store } from "~/store";
import { SurrealistAdapter } from "./base";

const WAIT_DURATION = 1000;

/**
 * Surrealist adapter for running as Wails desktop app
 */
export class DesktopAdapter implements SurrealistAdapter {

	#startTask: any;

	constructor() {
		this.initDatabaseEvents();
	}
	
	isServeSupported = true;
	isPinningSupported = true;
	isOpenURLSupported = true;
	isUpdateCheckSupported = true;
	isPromotionSupported = false;

	async setWindowTitle(title: string) {
		WindowSetTitle(title);
	}

	loadConfig() {
		return LoadConfig();	
	}

	saveConfig(config: string) {
		return SaveConfig(config);
	}

	startDatabase(username: string, password: string, port: number, localDriver: string, localPath: string) {
		return StartDatabase(username, password, port, localDriver, localPath);
	}

	stopDatabase() {
		return StopDatabase();
	}

	togglePinned() {
		return TogglePinned();
	}

	async openUrl(url: string) {
		BrowserOpenURL(url);
	}

	initDatabaseEvents() {

		EventsOn('database:start', () => {
			this.#startTask = setTimeout(() => {
				store.dispatch(actions.confirmServing());
	
				showNotification({
					autoClose: 1500,
					color: 'green.6',
					message: (
						<Stack spacing={0}>
							<Text weight={600}>
								Database started
							</Text>
							<Text color="light.5">
								Local database is now online
							</Text>
						</Stack>
					)
				});
			}, WAIT_DURATION);
		});
	
		EventsOn('database:stop', () => {
			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}
	
			store.dispatch(actions.stopServing());
	
			showNotification({
				autoClose: 1500,
				color: 'red.6',
				message: (
					<Stack spacing={0}>
						<Text weight={600}>
							Database stopped
						</Text>
						<Text color="light.5">
							Local database is now offline
						</Text>
					</Stack>
				)
			});
		});
	
		EventsOn('database:output', (kind, message) => {
			store.dispatch(actions.pushConsoleLine({ kind, message }));
		});
	
		EventsOn('database:error', (msg) => {
			if (this.#startTask) {
				clearTimeout(this.#startTask);
			}
			
			store.dispatch(actions.stopServing());
	
			showNotification({
				color: 'red.6',
				message: (
					<Stack spacing={0}>
						<Text weight={600}>
							Failed to start database
						</Text>
						<Text color="light.5">
							{msg}
						</Text>
					</Stack>
				)
			});
		});
	
	}	

};