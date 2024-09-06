import type { Extension, SelectionRange } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * An extension that reports on selection changes
 */
export const selectionChanged = (
	cb: (ranges: SelectionRange) => void,
): Extension => {
	return EditorView.updateListener.of((update) => {
		if (update.selectionSet) {
			cb(update.state.selection.main);
		}
	});
};
