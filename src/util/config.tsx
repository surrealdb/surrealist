import { isEqual } from "radash";
import { StoreApi, UseBoundStore } from "zustand";
import { useConfigStore } from "~/stores/config";
import { SurrealistConfig } from "~/types";

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
	then: (value: T) => void;
}) {
	const { store, select, then, initial } = options;

	if (initial) {
		options.then(select(store.getState()));
	}

	store.subscribe((state, prev) => {
		const value = select(state);

		if (!isEqual(value, select(prev))) {
			then(value);
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