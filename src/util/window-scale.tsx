import { getCurrentWebview } from "@tauri-apps/api/webview";
import { isDesktop } from "~/adapter";
import { useConfigStore } from "~/stores/config";

export function applyWindowScale(scale: number) {
	const zoom = scale / 100;

	if (isDesktop) {
		getCurrentWebview()
			.setZoom(zoom)
			.catch(() => {
				document.documentElement.style.zoom = `${zoom}`;
			});
		return;
	}

	document.documentElement.style.zoom = `${zoom}`;
}

export function increaseWindowScale() {
	const state = useConfigStore.getState();
	const next = Math.min(state.settings.appearance.windowScale + 10, 150);

	state.updateAppearanceSettings({ windowScale: next });
	applyWindowScale(next);
}

export function decreaseWindowScale() {
	const state = useConfigStore.getState();
	const next = Math.max(state.settings.appearance.windowScale - 10, 75);

	state.updateAppearanceSettings({ windowScale: next });
	applyWindowScale(next);
}

export function increaseEditorScale() {
	const state = useConfigStore.getState();

	state.updateAppearanceSettings({
		editorScale: Math.min(state.settings.appearance.editorScale + 10, 150),
	});
}

export function decreaseEditorScale() {
	const state = useConfigStore.getState();

	state.updateAppearanceSettings({
		editorScale: Math.max(state.settings.appearance.editorScale - 10, 50),
	});
}
