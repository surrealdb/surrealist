import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, indentWithTab } from "@codemirror/commands";
import {
	bracketMatching,
	codeFolding,
	foldGutter,
	foldKeymap,
	indentOnInput,
	indentUnit,
} from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import {
	EditorView,
	crosshairCursor,
	drawSelection,
	dropCursor,
	highlightActiveLineGutter,
	highlightSpecialChars,
	keymap,
	rectangularSelection,
} from "@codemirror/view";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { acceptWithTab } from "./keybinds";
import { customHistoryKeymap } from "./keymaps";

/**
 * Shared base configuration for all full editors
 */
export const editorBase = (): Extension => [
	highlightActiveLineGutter(),
	highlightSpecialChars(),
	codeFolding(),
	foldGutter(),
	drawSelection(),
	dropCursor(),
	indentOnInput(),
	bracketMatching(),
	closeBrackets(),
	autocompletion(),
	rectangularSelection(),
	crosshairCursor(),
	indentationMarkers({
		colors: {
			light: "var(--surrealist-indent-color)",
			dark: "var(--surrealist-indent-color)",
			activeLight: "var(--surrealist-indent-active-color)",
			activeDark: "var(--surrealist-indent-active-color)",
		},
	}),
	highlightSelectionMatches({
		highlightWordAroundCursor: true,
		wholeWords: true,
	}),
	keymap.of([
		acceptWithTab,
		indentWithTab,
		...closeBracketsKeymap,
		...defaultKeymap,
		...searchKeymap,
		...customHistoryKeymap,
		...foldKeymap,
		...completionKeymap,
	]),
	indentUnit.of("    "),
	EditorState.allowMultipleSelections.of(true),
	EditorView.lineWrapping,
];

/**
 * Shared base configuration for all input editors
 */
export const inputBase = (): Extension => [
	highlightSpecialChars(),
	history(),
	drawSelection(),
	indentOnInput(),
	bracketMatching(),
	closeBrackets(),
	keymap.of([
		...closeBracketsKeymap,
		...customHistoryKeymap,
		...defaultKeymap,
	]),
	indentUnit.of("    "),
	EditorView.lineWrapping,
];
