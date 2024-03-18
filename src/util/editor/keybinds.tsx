import { acceptCompletion } from "@codemirror/autocomplete";
import { KeyBinding } from "@codemirror/view";

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