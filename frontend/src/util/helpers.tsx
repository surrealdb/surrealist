import { SaveConfig } from "$/go/backend/Surrealist";
import { WindowSetTitle } from "$/runtime/runtime";
import { store } from "~/store";

export function updateTitle() {
	const { activeTab, isPinned, config, viewMode } = store.getState();

	let title = '';

	if (activeTab) {
		const tab = config.tabs.find(t => t.id === activeTab);

		if (tab) {
			title += `${tab.name} - `;
		}
	}

	if (viewMode === 'query') {
		title += 'Surrealist Query';
	} else if (viewMode === 'explorer') {
		title += 'Surrealist Explorer';
	} else if (viewMode === 'visualizer') {
		title += 'Surrealist Visualizer';
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