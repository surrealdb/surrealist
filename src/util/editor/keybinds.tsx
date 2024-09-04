import { acceptCompletion } from "@codemirror/autocomplete";
import { undo, redo, undoSelection, redoSelection } from "@codemirror/commands";
import { KeyBinding } from "@codemirror/view";
import { fillAllFieldsCommands } from "cm6-graphql";

/**
 * A keybind used to accept a completion
 */
export const acceptWithTab: KeyBinding = {
	key: "Tab",
	run: acceptCompletion
};

/**
 * Dummy keybind used to run a query, handled by
 * the global keybind handler
 */
export const runQuery: KeyBinding = {
	key: "Mod-Enter",
	run: () => {
		return true;
	}
};

/**
 * Fill all fields in a GraphQL query
 */
export const fillFields: KeyBinding = {
	key: "Alt-Space",
	run: fillAllFieldsCommands
};

export const customHistoryKeymap: readonly KeyBinding[] = [
	{key: "Mod-z", run: undo, preventDefault: true},
	{key: "Mod-Shift-z", run: redo, preventDefault: true},
	{key: "Mod-y", run: redo, preventDefault: true},
	{key: "Mod-u", run: undoSelection, preventDefault: true},
	{key: "Alt-u", mac: "Mod-Shift-u", run: redoSelection, preventDefault: true}
];