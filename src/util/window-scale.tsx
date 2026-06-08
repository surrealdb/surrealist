import { getCurrentWebview } from "@tauri-apps/api/webview";
import { isDesktop } from "~/adapter";
import { useConfigStore } from "~/stores/config";

export function applyWindowScale(scale: number) {
	if (!isDesktop) {
		return;
	}

	getCurrentWebview().setZoom(scale / 100);
}

export function increaseWindowScale() {
	if (!isDesktop) {
		return;
	}

	const state = useConfigStore.getState();
	const next = Math.min(state.settings.appearance.windowScale + 10, 150);

	state.updateAppearanceSettings({ windowScale: next });
	applyWindowScale(next);
}

export function decreaseWindowScale() {
	if (!isDesktop) {
		return;
	}

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
