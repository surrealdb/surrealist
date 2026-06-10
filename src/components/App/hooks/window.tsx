import { useSetting } from "~/hooks/config";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import {
	decreaseEditorScale,
	decreaseWindowScale,
	increaseEditorScale,
	increaseWindowScale,
} from "~/util/window-scale";

export function useWindowSettings() {
	const [windowPinned, setWindowPinned] = useSetting("behavior", "windowPinned");

	const increaseWindowScaleHandler = useStable(increaseWindowScale);
	const decreaseWindowScaleHandler = useStable(decreaseWindowScale);
	const increaseEditorScaleHandler = useStable(increaseEditorScale);
	const decreaseEditorScaleHandler = useStable(decreaseEditorScale);

	const toggleWindowPinned = useStable(() => {
		setWindowPinned(!windowPinned);
	});

	useIntent("increase-window-scale", increaseWindowScaleHandler);
	useIntent("decrease-window-scale", decreaseWindowScaleHandler);
	useIntent("increase-editor-scale", increaseEditorScaleHandler);
	useIntent("decrease-editor-scale", decreaseEditorScaleHandler);
	useIntent("toggle-pinned", toggleWindowPinned);
}
