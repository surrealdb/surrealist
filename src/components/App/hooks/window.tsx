import { useSetting } from "~/hooks/config";
import { useKeymap } from "~/hooks/keymap";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { clamp } from "~/util/helpers";

export function useWindowSettings() {
	const [windowScale, setWindowScale] = useSetting("appearance", "windowScale");
	const [editorScale, setEditorScale] = useSetting("appearance", "editorScale");
	const [windowPinned, setWindowPinned] = useSetting("behavior", "windowPinned");

	const increaseWindowScale = useStable(() => {
		setWindowScale(clamp(windowScale + 10, 75, 150));
	});

	const decreaseWindowScale = useStable(() => {
		setWindowScale(clamp(windowScale - 10, 75, 150));
	});

	const increaseEditorScale = useStable(() => {
		setEditorScale(clamp(editorScale + 10, 50, 150));
	});

	const decreaseEditorScale = useStable(() => {
		setEditorScale(clamp(editorScale - 10, 50, 150));
	});

	const toggleWindowPinned = useStable(() => {
		setWindowPinned(!windowPinned);
	});

	useKeymap([
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
