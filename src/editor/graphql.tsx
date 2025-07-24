import type { CompletionSource } from "@codemirror/autocomplete";
import { syntaxTree } from "@codemirror/language";
import { type Extension, Prec, StateEffect, StateField } from "@codemirror/state";
import { EditorView, keymap, ViewPlugin } from "@codemirror/view";
import { fillAllFieldsCommands, graphqlLanguage, type Position } from "cm6-graphql";
import { type DocumentNode, type GraphQLSchema, parse } from "graphql";
import { fillGraphqlFields } from "./keybinds";
import { graphqlSuggestions } from "./keymaps";

const documentEffect = StateEffect.define<DocumentNode | undefined>();

const documentField = StateField.define<DocumentNode | undefined>({
	create() {
		return undefined;
	},
	update(set, tr) {
		for (const e of tr.effects) {
			if (e.is(documentEffect)) {
				return e.value;
			}
		}

		return set;
	},
});

function dispatchAst(view: EditorView) {
	const query = view.state.doc.toString();

	try {
		const parsed = parse(query.replaceAll(/{\s*}/g, ""));

		view.dispatch({
			effects: documentEffect.of(parsed),
		});
	} catch {
		view.dispatch({
			effects: documentEffect.of(undefined),
		});
	}
}

const updateAst = (): Extension => [
	ViewPlugin.fromClass(
		class {
			public constructor(view: EditorView) {
				setTimeout(() => dispatchAst(view));
			}
		},
	),
	EditorView.updateListener.of((update) => {
		if (update.docChanged) {
			dispatchAst(update.view);
		}
	}),
];

/**
 * An extension which automatically parses the query AST and
 * exposes it using `getGraphqlDocument`.
 */
export const graphqlParser = (): Extension => [updateAst(), documentField];

/**
 * Returns the parsed document AST for an editor
 */
export function getGraphqlDocument(view: EditorView) {
	return view.state.field(documentField);
}

const FILL_FIELDS_SOURCE: CompletionSource = (context) => {
	const previous = syntaxTree(context.state).resolveInner(context.pos, -1);

	if (context.state.doc.lineAt(context.pos).text.trim() !== "") {
		return null;
	}

	if (previous.name !== "SelectionSet" || previous.parent?.name !== "Field") {
		return null;
	}

	return {
		from: context.pos,
		options: [
			{
				boost: 10_000,
				label: "Fill all fields",
				apply: fillAllFieldsCommands,
			},
		],
	};
};

/**
 * Automatically fill in all fields in a GraphQL query
 */
export const graphqlFillFields = (): Extension => [
	Prec.highest(keymap.of([fillGraphqlFields, ...graphqlSuggestions])),
	graphqlLanguage.data.of({
		autocomplete: FILL_FIELDS_SOURCE,
	}),
];

/**
 * Insert all fields into the current GraphQL query
 */
export function handleFillFields(
	_view: EditorView,
	_schema: GraphQLSchema,
	_query: string,
	_cursor: Position,
) {
	// TODO Implement this
}
