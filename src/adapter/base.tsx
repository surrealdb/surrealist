import { Result } from "~/typings/utilities";

export interface SurrealistAdapter {

	/**
	 * Returns whether local database serving is supported
	 */
	isServeSupported: boolean;

	/**
	 * Returns whether window pinning is supported
	 */
	isPinningSupported: boolean;

	/**
	 * Returns whether update checking is supported
	 */
	isUpdateCheckSupported: boolean;

	/**
	 * Returns whether promotion is supported
	 */
	isPromotionSupported: boolean;

	/**
	 * Set the window title
	 *
	 * @param title The title to set
	 */
	setWindowTitle(title: string): Promise<void>;

	/**
	 * Load the config from the adapter
	 */
	loadConfig(): Promise<string>;

	/**
	 * Save the config to the adapter
	 *
	 * @param config The config to save
	 */
	saveConfig(config: string): Promise<void>;

	/**
	 * Start the database with the given parameters
	 */
	startDatabase(
		username: string,
		password: string,
		port: number,
		localDriver: string,
		localPath: string,
		surrealPath: string
	): Promise<void>;

	/**
	 * Stop the currently running database
	 */
	stopDatabase(): Promise<void>;

	/**
	 * Set the pinned state of the window
	 */
	setWindowPinned(pinned: boolean): Promise<void>;

	/**
	 * Open the given URL in the default browser
	 *
	 * @param url The URL to open
	 */
	openUrl(url: string): Promise<void>;

	/**
	 * Save a file locally
	 */
	saveFile(
		title: string,
		defaultPath: string,
		filters: any,
		content: () => Result<string>
	): Promise<boolean>;

	/**
	 * Open a file locally
	 */
	openFile(
		title: string,
		filters: any,
		multiple: boolean
	): Promise<string | null>;

}
