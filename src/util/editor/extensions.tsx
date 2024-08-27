import { linter } from "@codemirror/lint";
import { getSetting } from "../config";
import { surrealqlLanguage } from "@surrealdb/codemirror";
import { defaultKeymap, history, indentWithTab } from "@codemirror/commands";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap, CompletionSource, snippetCompletion } from "@codemirror/autocomplete";
import { keymap, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLineGutter, EditorView, Decoration, GutterMarker, ViewPlugin } from "@codemirror/view";
import { syntaxHighlighting, indentOnInput, bracketMatching, foldGutter, foldKeymap, codeFolding, indentUnit, syntaxTree } from "@codemirror/language";
import { indentationMarkers } from '@replit/codemirror-indentation-markers';
import { EditorState, Extension, Prec, RangeSetBuilder, SelectionRange, StateEffect, StateField } from "@codemirror/state";
import { acceptWithTab, customHistoryKeymap, runQuery } from "./keybinds";
import { DARK_STYLE, LIGHT_STYLE } from "./theme";
import { useDatabaseStore } from "~/stores/database";
import { getActiveQuery } from "../connection";
import { isModKey, tryParseParams } from "../helpers";
import { validateQuery } from "../surrealql";
import { DefinitionNode, DocumentNode, parse } from "graphql";
import { mdiMenuRight } from "@mdi/js";

type RecordLinkCallback = (link: string) => void;

/**
 * The color scheme used within editors
 */
export const colorTheme = (isLight?: boolean) =>
	syntaxHighlighting(isLight ? LIGHT_STYLE : DARK_STYLE, { fallback: true });

/**
 * Shared base configuration for all dedicated editors
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
			light: 'var(--surrealist-indent-color)',
			dark: 'var(--surrealist-indent-color)',
			activeLight: 'var(--surrealist-indent-active-color)',
			activeDark: 'var(--surrealist-indent-active-color)',
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
		validFor: /[\w:]+$/,
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

const SVG_NS = "http://www.w3.org/2000/svg";

const GraphqlRunMarker = class extends GutterMarker {

	public definition?: DefinitionNode;

	public constructor(definition?: DefinitionNode) {
		super();
		this.definition = definition;
	}

	public toDOM() {
		const svg = document.createElementNS(SVG_NS, "svg");
		const path = document.createElementNS(SVG_NS, "path");

		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("style", "width: 24px; height: 24px; fill: currentColor; stroke: currentColor; stroke-width: 1; cursor: pointer");

		path.setAttribute("d", mdiMenuRight);

		svg.append(path);

		return svg;
	}

};

const graphqlAstEffect = StateEffect.define<DocumentNode | undefined>();

/**
 * A state field tracking the current GraphQL AST
 */
export const graphqlAstField = StateField.define<DocumentNode | undefined>({
	create() {
		return undefined;
	},
	update(set, tr) {
		for (const e of tr.effects) {
			if (e.is(graphqlAstEffect)) {
				return e.value;
			}
		}

		return set;
	}
});

// /**
//  * A state field tracking the executable gutter markers
//  */
// export const graphqlMarkersField = StateField.define<RangeSet<GutterMarker>>({
// 	create() {
// 		return RangeSet.empty;
// 	},
// 	update(set, tr) {
// 		for (const e of tr.effects) {
// 			if (e.is(graphqlAstEffect)) {
// 				if (e.value) {
// 					const markers = new RangeSetBuilder<GutterMarker>();

// 					for (const def of e.value.definitions) {
// 						if (def.loc) {
// 							markers.add(def.loc.start, def.loc.end, new GraphqlRunMarker(def));
// 						}
// 					}

// 					return markers.finish();
// 				} else {
// 					return RangeSet.empty;
// 				}
// 			}
// 		}

// 		return set;
// 	}
// });

function dispatchAst(view: EditorView) {
	const query = view.state.doc.toString();

	try {
		const parsed = parse(query);

		view.dispatch({
			effects: graphqlAstEffect.of(parsed)
		});
	} catch {
		view.dispatch({
			effects: graphqlAstEffect.of(undefined)
		});
	}
}

/**
 * Continuously parse the GraphQL query and save the AST in the state
 */
export const graphqlParser = (): Extension => [
	ViewPlugin.fromClass(class {
		public constructor(view: EditorView) {
			setTimeout(() => dispatchAst(view));
		}
	}),
	EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			dispatchAst(update.view);
		}
	})
];

// /**
//  * Add query run indicator to gutter
//  */
// export const graphqlRunning = (onRun: (name: string) => void): Extension => [
// 	graphqlMarkersField,
// 	gutter({
// 		class: "cm-runGutter",
// 		markers: v => v.state.field(graphqlMarkersField),
// 		initialSpacer: () => new GraphqlRunMarker(),
// 		domEventHandlers: {
// 			mousedown(view, line) {
// 				view.mark
// 			}
// 		}
// 	})
// ];
