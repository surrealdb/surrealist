import { useEffect } from "react";
import { useSetting } from "~/hooks/config";
import { useCompatHotkeys } from "~/hooks/hotkey";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { clamp, isModKey } from "~/util/helpers";

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

export function useModTracker() {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isModKey(e)) {
				document.body.classList.add("mod");
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (isModKey(e)) {
				document.body.classList.remove("mod");
			}
		};

		document.body.addEventListener("keydown", onKeyDown);
		document.body.addEventListener("keyup", onKeyUp);

		return () => {
			document.body.removeEventListener("keydown", onKeyDown);
			document.body.removeEventListener("keyup", onKeyUp);
		};
	}, []);
}