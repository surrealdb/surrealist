import { redo, redoSelection, undo, undoSelection } from "@codemirror/commands";
import type { KeyBinding } from "@codemirror/view";
import { addCursorAbove, addCursorBelow, suggestCompletions } from "./commands";
import { executeGraphqlEditorQuery, selectCursorQuery } from "./query";

/**
 * A custom variant of the history keymap that uses
 * the Mod key instead of the Ctrl key
 */
export const customHistoryKeymap: readonly KeyBinding[] = [
	{ key: "Mod-z", run: undo, preventDefault: true },
	{ key: "Mod-Shift-z", run: redo, preventDefault: true },
	{ key: "Mod-y", run: redo, preventDefault: true },
	{ key: "Mod-u", run: undoSelection, preventDefault: true },
	{
		key: "Alt-u",
		mac: "Mod-Shift-u",
		run: redoSelection,
		preventDefault: true,
	},
];

/**
 * A keymap used to run the editor contents as a query
 */
export const runQueryKeymap: readonly KeyBinding[] = [
	{ key: "Mod-Enter", run: () => true },
	{ key: "Mod-e", run: selectCursorQuery },
];

/**
 * A keymap used to run the editor contents as a GraphQL query
 */
export const runGraphqlQueryKeymap: readonly KeyBinding[] = [
	{ key: "Mod-Enter", run: executeGraphqlEditorQuery },
	{ key: "F9", run: executeGraphqlEditorQuery },
];

/**
 * A keymap used to suggest GraphQL completions
 */
export const graphqlSuggestions: readonly KeyBinding[] = [
	{ key: "Enter", run: suggestCompletions },
	{ key: "Shift-(", run: suggestCompletions },
];

/**
 * A keymap used to add a cursor below and above the current position
 */
export const addCursorVerticallyKeymap: readonly KeyBinding[] = [
	{ key: "Mod-Alt-ArrowUp", run: addCursorAbove },
	{ key: "Mod-Alt-ArrowDown", run: addCursorBelow },
];
