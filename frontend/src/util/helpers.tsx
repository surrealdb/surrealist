import { SaveConfig } from "$/go/backend/Surrealist";
import { WindowSetTitle } from "$/runtime/runtime";
import { uid } from "radash";
import { actions, store } from "~/store";

export function updateTitle() {
	const { activeTab, isPinned, config } = store.getState();

	let title = 'Surrealist';

	if (activeTab) {
		const tab = config.tabs.find(t => t.id === activeTab);

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
	return SaveConfig(JSON.stringify(store.getState().config));
}