import { acceptCompletion, startCompletion } from "@codemirror/autocomplete";
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
 * Fill all fields in the current GraphQL query type
 */
export const fillGraphqlFields: KeyBinding = {
	key: "Alt-Space",
	run: fillAllFieldsCommands
};

/**
 * Suggest GraphQL fields at the start of each line
 */
export const suggestGraphqlFields: KeyBinding = {
	key: "Enter",
	run: (view) => {
		setTimeout(() => startCompletion(view));
		return false;
	}
};