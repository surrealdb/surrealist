import { startCompletion } from "@codemirror/autocomplete";
import type { Command, EditorView } from "@codemirror/view";

/**
 * Suggest completions at the start of each line
 */
export const suggestCompletions: Command = (view: EditorView) => {
	setTimeout(() => startCompletion(view));
	return false;
};
