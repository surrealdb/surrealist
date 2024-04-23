import { useSetting } from "~/hooks/config";
import { useCompatHotkeys } from "~/hooks/hotkey";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";

export function useWindowSettings() {
	const [windowScale, setWindowScale] = useSetting("appearance", "windowScale");
	const [editorScale, setEditorScale] = useSetting("appearance", "editorScale");
	const [windowPinned, setWindowPinned] = useSetting("behavior", "windowPinned");

	const increaseWindowScale = useStable(() => {
		setWindowScale(windowScale + 10);
	});

	const decreaseWindowScale = useStable(() => {
		setWindowScale(windowScale - 10);
	});

	const increaseEditorScale = useStable(() => {
		setEditorScale(editorScale + 10);
	});

	const decreaseEditorScale = useStable(() => {
		setEditorScale(editorScale - 10);
	});

	const toggleWindowPinned = useStable(() => {
		setWindowPinned(!windowPinned);
	});

	useCompatHotkeys([
		["mod+equal", increaseWindowScale],
		["mod+minus", decreaseWindowScale],
		["mod+shift+equal", increaseEditorScale],
		["mod+shift+minus", decreaseEditorScale],
		["f10", toggleWindowPinned],
	]);

	useIntent("increase-window-scale", increaseWindowScale);
	useIntent("decrease-window-scale", decreaseWindowScale);
	useIntent("increase-editor-scale", increaseEditorScale);
	useIntent("decrease-editor-scale", decreaseEditorScale);
	useIntent("toggle-pinned", toggleWindowPinned);
}