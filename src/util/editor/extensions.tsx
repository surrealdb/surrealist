import { linter } from "@codemirror/lint";
import { getSetting } from "../config";
import { surrealqlLanguage } from "codemirror-surrealql";
import { defaultKeymap, history, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, CompletionSource, snippetCompletion } from "@codemirror/autocomplete";
import { keymap, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter, EditorView, Decoration } from "@codemirror/view";
import { syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap, codeFolding, indentUnit, syntaxTree } from "@codemirror/language";
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { themeColor } from "../mantine";
import { EditorState, Extension, Prec, RangeSetBuilder, SelectionRange } from "@codemirror/state";
import { acceptWithTab, customHistoryKeymap, runQuery } from "./keybinds";
import { DARK_STYLE, LIGHT_STYLE } from "./theme";
import { useDatabaseStore } from "~/stores/database";
import { getActiveQuery } from "../connection";
import { isModKey, tryParseParams } from "../helpers";
import { validateQuery } from "../surrealql";

type RecordLinkCallback = (link: string) => void;

/**
 * The color scheme used within editors
 */
export const colorTheme = () => [
	syntaxHighlighting(DARK_STYLE, { fallback: true }),
	syntaxHighlighting(LIGHT_STYLE, { fallback: true }),
];

/**
 * Shared base configuration for all dedicated editors
 */
export const editorBase = (): Extension => [
	lineNumbers(),
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
	colorTheme(),
	history({
		newGroupDelay: 250
	}),
	indentationMarkers({
		colors: {
			light: themeColor('slate'),
			dark: themeColor('slate'),
			activeLight: themeColor('slate'),
			activeDark: themeColor('slate'),
		}
	}),
	highlightSelectionMatches({
		highlightWordAroundCursor: true,
		wholeWords: true
	}),
	keymap.of([
		runQuery,
		acceptWithTab,
		indentWithTab,
		...closeBracketsKeymap,
		...defaultKeymap,
		...searchKeymap,
		...customHistoryKeymap,
		...foldKeymap,
		...completionKeymap
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
	colorTheme(),
	keymap.of([
		...closeBracketsKeymap,
		...customHistoryKeymap,
		...defaultKeymap,
	]),
	indentUnit.of("    "),
	EditorView.lineWrapping,
];

/**
 * SurrealQL error linting
 */
export const surqlLinting = (): Extension => linter(view => {
	const isEnabled = getSetting("behavior", "queryErrorChecker");
	const content = view.state.doc.toString();

	if (!isEnabled || !content) {
		return [];
	}

	const message = validateQuery(content) || "";
	const match = message.match(/parse error: (failed to parse query at line (\d+) column (\d+).+)\n/i);

	if (match) {
		const reason = match[1].trim();
		const lineNumber = Number.parseInt(match[2]);
		const column = Number.parseInt(match[3]);

		const position = view.state.doc.line(lineNumber).from + column - 1;
		const word = view.state.wordAt(position);

		return [word ? {
			from: word.from,
			to: word.to,
			message: reason,
			severity: "error",
			source: "SurrealQL"
		} : {
			from: position,
			to: position + 1,
			message: reason,
			severity: "error",
			source: "SurrealQL"
		}];
	}

	return [];
});

const TABLE_SOURCE: CompletionSource = (context) => {
	const match = context.matchBefore(/(from|update|create|delete|into) \w*/i);
	const tables = useDatabaseStore.getState().databaseSchema?.tables || [];
	const names = tables.map(table => table.schema.name);

	if (!context.explicit && !match) {
		return null;
	}

	return {
		from: match ? match!.from + match!.text.indexOf(' ') + 1 : context.pos,
		validFor: /\w+$/,
		options: names.map(table => ({
			label: table,
			type: "class"
		}))
	};
};

/**
 * An extension used to autocomplete table names
 */
export const surqlTableCompletion = (): Extension => {
	return surrealqlLanguage.data.of({
		autocomplete: TABLE_SOURCE
	});
};

const VARIABLE_SOURCE: CompletionSource = (context) => {
	const match = context.matchBefore(/\$\w*/i);
	const query = getActiveQuery();

	if (!query || (!context.explicit && !match)) {
		return null;
	}

	const variables = Object.keys(tryParseParams(query.variables));

	return {
		from: match ? match.from : context.pos,
		validFor: /\$\w+$/,
		options: variables.map(variable => ({
			label: '$' + variable,
			type: "variable"
		}))
	};
};

/**
 * An extension used to autocomplete query variables
 */
export const surqlVariableCompletion = (): Extension => {
	return surrealqlLanguage.data.of({
		autocomplete: VARIABLE_SOURCE
	});
};

const CUSTOM_FUNCTION_SOURCE: CompletionSource = (context) => {
	const match = context.matchBefore(/fn::\w*/i);
	const functions = useDatabaseStore.getState().databaseSchema?.functions || [];
	const names = functions.map(fn => `fn::${fn.name}`);

	if (!context.explicit && !match) {
		return null;
	}

	return {
		from: match ? match.from : context.pos,
		validFor: /\w+$/,
		options: names.map(label => snippetCompletion(`${label}(#{1})`, {
			label,
			type: 'function'
		}))
	};
};

/**
 * An extension used to autocomplete table names
 */
export const surqlCustomFunctionCompletion = (): Extension => {
	return surrealqlLanguage.data.of({
		autocomplete: CUSTOM_FUNCTION_SOURCE
	});
};

const RECORD_LINK_MARK = Decoration.mark({
	class: "cm-record-link",
	attributes: {
		title: "Cmd/Ctrl + Click to open record"
	}
});

const RECORD_LINK_DECORATOR = (view: EditorView) => {
	const builder = new RangeSetBuilder<Decoration>();
	const tree = syntaxTree(view.state);

	tree.iterate({
		enter(node) {
			if (node.type.name === "RecordId") {
				builder.add(node.from, node.to, RECORD_LINK_MARK);
			}
		}
	});

	return builder.finish();
};

/**
 * An extension used to highlight record links
 */
export const surqlRecordLinks = (onClick: RecordLinkCallback): Extension => [
	EditorView.decorations.of(RECORD_LINK_DECORATOR),
	Prec.highest(EditorView.domEventHandlers({
		mousedown: (event, view) => {
			if (!isModKey(event))
				return false;

			const pos = view.posAtDOM(event.target as HTMLElement);
			let token = syntaxTree(view.state).resolveInner(pos, 1);

			while (token && (token.name !== "RecordId")) {
				token = token.parent as any;
			}

			if (token) {
				const link = view.state.sliceDoc(token.from, token.to);

				if (link) {
					onClick(link);
					return true;
				}
			}
		}
	}))
];

/**
 * An extension that reports on selection changes
 */
export const selectionChanged = (cb: (ranges: SelectionRange) => void): Extension => {
	return EditorView.updateListener.of((update) => {
		if (update.selectionSet) {
			cb(update.state.selection.main);
		}
	});
};