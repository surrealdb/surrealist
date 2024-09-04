import { undo, redo, undoSelection, redoSelection } from "@codemirror/commands";
import { KeyBinding } from "@codemirror/view";

/**
 * A custom variant of the history keymap that uses
 * the Mod key instead of the Ctrl key
 */
export const customHistoryKeymap: readonly KeyBinding[] = [
	{key: "Mod-z", run: undo, preventDefault: true},
	{key: "Mod-Shift-z", run: redo, preventDefault: true},
	{key: "Mod-y", run: redo, preventDefault: true},
	{key: "Mod-u", run: undoSelection, preventDefault: true},
	{key: "Alt-u", mac: "Mod-Shift-u", run: redoSelection, preventDefault: true}
];