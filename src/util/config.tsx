import { assign, debounce, isEqual } from "radash";
import { StoreApi, UseBoundStore } from "zustand";
import { adapter } from "~/adapter";
import { useConfigStore } from "~/stores/config";
import { SurrealistConfig } from "~/types";
import { applyMigrations } from "./migrator";
import { CONFIG_VERSION } from "./defaults";
import { showDowngradeWarningModal } from "./downgrade";

export type Category = keyof SurrealistConfig["settings"];
export type Settings<T extends Category> = SurrealistConfig["settings"][T];
export type StoreType<T> = T extends UseBoundStore<StoreApi<infer I>> ? I : never;

/**
 * Watch a store for changes and invoke the callback when the
 * selected state changes.
 *
 * @param options The watch options
 */
export function watchStore<T, S extends UseBoundStore<StoreApi<any>>>(options: {
	initial?: boolean;
	store: S;
	select: (slice: StoreType<S>) => T;
	then: (value: T, prev?: T) => void;
}) {
	const { store, select, then, initial } = options;

	if (initial) {
		options.then(select(store.getState()));
	}

	store.subscribe((state, prev) => {
		const value = select(state);

		if (!isEqual(value, select(prev))) {
			then(value, select(prev));
		}
	});
}

/**
 * Get a single setting from the config store
 *
 * @param category The category
 * @param key The setting key
 * @returns Setting value
 */
export function getSetting<C extends Category, K extends keyof Settings<C>>(category: C, key: K) {
	return useConfigStore.getState().settings[category][key];
}

/**
 * Start the config synchronization process
 */
export async function startConfigSync() {
	const loadedConfig = await adapter.loadConfig();
	const migrateConfig = applyMigrations(loadedConfig);
	const config = assign<SurrealistConfig>(useConfigStore.getState(), migrateConfig);
	const compatible = config.configVersion <= CONFIG_VERSION;

	// Handle incompatible config versions
	if (!compatible) {
		setTimeout(showDowngradeWarningModal, 250);
		return;
	}

	// Update the internal config state
	useConfigStore.setState(config);

	// Sync the config with the adapter
	useConfigStore.subscribe(debounce({
		delay: 250
	}, (state) => {
		adapter.saveConfig(state);
	}));
}