import type { Platform, SurrealistConfig, UrlTarget } from "~/types";

export interface OpenedTextFile {
	name: string;
	content: string;
	self: File | undefined;
}

export interface OpenedBinaryFile {
	name: string;
	content: Blob;
}

export interface SurrealistAdapter {
	/**
	 * Identifier for this adapter
	 */
	id: string;

	/**
	 * Returns whether local database serving is supported
	 */
	isServeSupported: boolean;

	/**
	 * Returns whether update checking is supported
	 */
	isUpdateCheckSupported: boolean;

	/**
	 * Whether telemetry is enabled
	 */
	isTelemetryEnabled: boolean;

	/**
	 * Whether the sample sandbox is enabled
	 */
	isSampleSandboxEnabled: boolean;

	/**
	 * What the titlebar offset is if applicable
	 */
	titlebarOffset: number;

	/**
	 * The currently active platform
	 */
	platform: Platform;

	/**
	 * Initialize any adapter specific services. This function is invoked
	 * after the config has been loaded.
	 */
	initialize(): Result<void>;

	/**
	 * Return debug information about the current environment of the adapter
	 */
	dumpDebug(): object;

	/**
	 * Set the window title
	 *
	 * @param title The title to set
	 */
	setWindowTitle(title: string): Promise<void>;

	/**
	 * Load the config from the adapter
	 */
	loadConfig(): Promise<any>;

	/**
	 * Process the config after loading it. At this point the config
	 * has been repaired and migrated to the latest version.
	 *
	 * @param config The config to process
	 */
	processConfig(config: SurrealistConfig): Result<SurrealistConfig>;

	/**
	 * Save the config to the adapter
	 *
	 * @param config The config to save
	 */
	saveConfig(config: SurrealistConfig): Promise<void>;

	/**
	 * Start the database with the given parameters
	 */
	startDatabase(): Promise<void>;

	/**
	 * Stop the currently running database
	 */
	stopDatabase(): Promise<void>;

	/**
	 * Open the given URL in the default browser
	 *
	 * @param url The URL to open
	 * @param target The target to open the URL in
	 */
	openUrl(url: string, target?: UrlTarget): Promise<void>;

	/**
	 * Save a file locally
	 */
	saveFile(
		title: string,
		defaultPath: string,
		filters: any,
		content: () => Result<string | Blob | null>,
	): Promise<boolean>;

	/**
	 * Open a text file locally
	 */
	openTextFile(title: string, filters: any, multiple: boolean): Promise<OpenedTextFile[]>;

	/**
	 * Open a binary file locally
	 */
	openBinaryFile(title: string, filters: any, multiple: boolean): Promise<OpenedBinaryFile[]>;

	/**
	 * Log a message to the implemented logging system
	 */
	log(label: string, message: string): void;

	/**
	 * Log a warning message to the implemented logging system
	 */
	warn(label: string, message: string): void;

	/**
	 * Log a trace message to the implemented logging system
	 */
	trace(label: string, message: string): void;

	/**
	 * Perform a native HTTP request
	 *
	 * @param url The URL to fetch
	 * @param options The fetch options
	 */
	fetch(url: string, options?: RequestInit): Promise<Response>;

	/**
	 * Track an analytics event by it's url
	 *
	 * @param url The URL of the event
	 */
	trackEvent(url: string): Promise<void>;
}
