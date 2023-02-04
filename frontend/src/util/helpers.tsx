import { SaveConfig } from "$/go/backend/Surrealist";
import { WindowSetTitle } from "$/runtime/runtime";
import { actions, store } from "~/store";

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

/**
 * Apply the current zoom level to the document
 */
export function updateZoom() {
	const zoom = store.getState().config.zoomLevel;

	(document.documentElement.style as any).zoom = `${zoom}`;
}

/**
 * Watch for changes to the native theme
 */
export function watchNativeTheme() {
	const mediaMatch = window.matchMedia('(prefers-color-scheme: dark)');

	store.dispatch(actions.setNativeTheme(mediaMatch.matches ? 'dark' : 'light'));

	mediaMatch.addEventListener('change', event => {
		console.log('media change');

		store.dispatch(actions.setNativeTheme(event.matches ? 'dark' : 'light'));
	});
}