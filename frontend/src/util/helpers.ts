import { SaveConfig } from "$/go/main/App";
import { WindowSetTitle } from "$/runtime/runtime";
import { store } from "~/store";

export function renameWindow(name?: string) {
	if (name) {
		WindowSetTitle(`Surrealist - ${name}`);
	} else {
		WindowSetTitle(`Surrealist`);
	}
}

/**
 * Update the config on disk with the current state of the app
 */
export async function updateConfig() {
	const { colorScheme, knownTabs } = store.getState();

	return SaveConfig(JSON.stringify({
		theme: colorScheme,
		tabs: knownTabs
	}));
}