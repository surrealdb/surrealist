import { debounce } from "radash";
import { store } from "~/store";
import { SurrealistConfig } from "~/types";
import { adapter } from "~/adapter";

let lastConfig: SurrealistConfig | null = null;

const scheduleSave = debounce({ delay: 1500 }, () => {
	const config = store.getState().config;

	if (lastConfig === config) {
		return;
	}

	lastConfig = config;

	adapter.saveConfig(JSON.stringify(store.getState().config));
});

export function registerConfigSaver() {
	store.subscribe(scheduleSave);
}