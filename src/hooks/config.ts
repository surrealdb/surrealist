import { type ConfigStore, useConfigStore } from "~/stores/config";
import type { Category, Settings } from "~/util/config";
import { useStable } from "./stable";

const ACTIONS = {
	behavior: "updateBehaviorSettings",
	appearance: "updateAppearanceSettings",
	templates: "updateTemplateSettings",
	serving: "updateServingSettings",
	cloud: "updateCloudSettings",
} satisfies Record<Category, keyof ConfigStore>;

/**
 * Subscribe to a setting in the config store and
 * expose an updater function to change the setting.
 *
 * @param category The category of the setting.
 * @param key The key of the setting.
 */
export function useSetting<C extends Category, K extends keyof Settings<C>>(
	category: C,
	key: K,
) {
	return [
		useConfigStore((state) => state.settings[category][key]),
		useStable((value: Settings<C>[typeof key]) => {
			useConfigStore.getState()[ACTIONS[category]]({
				[key]: value,
			});
		}),
	] as const;
}
