import { SaveConfig } from "$/go/main/App";
import { WindowSetTitle } from "$/runtime/runtime";
import { store } from "~/store";

export function updateTitle() {
	const { activeTab, isPinned, knownTabs } = store.getState();

	let title = 'Surrealist';

	if (activeTab) {
		const tab = knownTabs.find(t => t.id === activeTab);

		if (tab) {
			title += ` - ${tab.name}`;
		}
	}

	if (isPinned) {
		title += ' (Pinned)';
	}

	WindowSetTitle(title);
}

/**
 * Update the config on disk with the current state of the app
 */
export async function updateConfig() {
	const { colorScheme, knownTabs, autoConnect, tableSuggest, wordWrap } = store.getState();

	return SaveConfig(JSON.stringify({
		theme: colorScheme,
		tabs: knownTabs,
		autoConnect: autoConnect,
		tableSuggest: tableSuggest,
		wordWrap: wordWrap,
	}));
}