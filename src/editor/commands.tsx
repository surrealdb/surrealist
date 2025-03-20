import { startCompletion } from "@codemirror/autocomplete";
import { EditorSelection, SelectionRange } from "@codemirror/state";
import type { Command, EditorView } from "@codemirror/view";

/**
 * Suggest completions at the start of each line
 */
export const suggestCompletions: Command = (view: EditorView) => {
	setTimeout(() => startCompletion(view));
	return false;
};

/**
 * Mimicking other editors add a new cursor in the specified direction for
 * each selection.
 */
function addCursorVertically(view: EditorView, offset: number) {
	const { state } = view;
	const { doc } = state;
	const newRanges = [] as SelectionRange[];

	for (const range of state.selection.ranges) {
		const line = doc.lineAt(range.head);

		const newLineNumber = line.number + offset;
		if (newLineNumber < 1 || newLineNumber > doc.lines) {
			continue;
		}

		const lineAnchor = range.anchor - line.from;
		const lineHead = range.head - line.from;
		const newLine = doc.line(newLineNumber);
		const newAnchor = newLine.from + Math.min(Math.max(lineAnchor, 0), newLine.length);
		const newTo = newLine.from + Math.min(Math.max(lineHead, 0), newLine.length);

		newRanges.push(EditorSelection.range(newAnchor, newTo));
	}

	if (newRanges.length === 0) return false;

	view.dispatch({
		selection: EditorSelection.create(
			[...state.selection.ranges, ...newRanges],
			state.selection.mainIndex,
		),
		scrollIntoView: true,
	});

	return true;
}

/**
 * Add cursor above the current line
 */
export const addCursorAbove: Command = (view: EditorView) => {
	return addCursorVertically(view, -1);
};

/**
 * Add cursor below the current line
 */
export const addCursorBelow: Command = (view: EditorView) => {
	return addCursorVertically(view, 1);
};
