import { type ConfigStore, useConfigStore } from "~/stores/config";
import type { LineNumberTarget } from "~/types";
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

/**
 * Allow checking and setting line number visibility for different target editors
 */
export function useLineNumberSetting() {
	const [lineNumbers, setLineNumbers] = useSetting("appearance", "lineNumbers");

	const hasLineNumbers = useStable((target: LineNumberTarget) => lineNumbers.includes(target));

	const toggleLineNumbers = useStable((target: LineNumberTarget) => {
		setLineNumbers(
			hasLineNumbers(target)
				? lineNumbers.filter((t) => t !== target)
				: [...lineNumbers, target],
		);
	});

	return [hasLineNumbers, toggleLineNumbers] as const;
}