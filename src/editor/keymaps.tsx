import { redo, redoSelection, undo, undoSelection } from "@codemirror/commands";
import type { KeyBinding } from "@codemirror/view";
import {
	executeEditorQuery,
	executeGraphqlEditorQuery,
	suggestCompletions,
} from "./commands";

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
	{ key: "Mod-Enter", run: executeEditorQuery },
	{ key: "F9", run: executeEditorQuery },
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
