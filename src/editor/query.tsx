import { EditorSelection, SelectionRange, StateEffect, StateField } from "@codemirror/state";
import type { Command, EditorView } from "@codemirror/view";
import { executeGraphql, executeUserQuery } from "~/screens/surrealist/connection/connection";
import { getConnection } from "~/util/connection";
import { tryParseParams } from "~/util/helpers";
import { getQueryRange } from "./surrealql";

const queryEditorEffect = StateEffect.define<EditorView>();

/**
 * The field holding the target query editor
 */
export const queryEditorField = StateField.define<EditorView | undefined>({
	create() {
		return undefined;
	},
	update(set, tr) {
		for (const e of tr.effects) {
			if (e.is(queryEditorEffect)) {
				return e.value;
			}
		}

		return set;
	},
});

/**
 * Set the query editor the current view is using
 *
 * @param currentView The view to update
 * @param queryView The view holding the query
 */
export function setQueryEditor(currentView: EditorView, queryView?: EditorView) {
	currentView.dispatch({
		effects: queryEditorEffect.of(queryView ?? currentView),
	});
}

/**
 * Execute the contents of the editor as a query
 * The source editor can be overriden using the `queryEditorEffect`
 */
export const executeEditorQuery = (view: EditorView, allowSelectionExecution: boolean) => {
	const editor = view.state.field(queryEditorField, false) ?? view;
	const ranges = editor.state.selection.ranges;

	let override = "" as string | undefined;

	if (allowSelectionExecution) {
		if (ranges.length === 1 && !ranges[0].empty) {
			override = editor.state.sliceDoc(ranges[0].from, ranges[0].to);
		} else if (ranges.length > 1) {
			for (const range of ranges) {
				if (range.empty) {
					const query = getQueryRange(view, range.head);
					if (!query) continue;

					const [from, to] = query;
					override += `${editor.state.sliceDoc(from, to)};\n`;
				} else {
					override += `${editor.state.sliceDoc(range.from, range.to)};\n`;
				}
			}
		}
	} else {
		override = undefined;
	}

	executeUserQuery({
		override,
	});

	return true;
};

/**
 * Select the query the cursor is currently in
 */
export const selectCursorQuery: Command = (view: EditorView) => {
	const ranges = [] as SelectionRange[];

	for (const selection of view.state.selection.ranges) {
		const range = getQueryRange(view, selection.head);
		if (!range) {
			continue;
		}

		const [from, to] = range;
		ranges.push(EditorSelection.range(from, to));
	}

	if (!ranges.length) {
		return true;
	}

	view.dispatch({
		selection: EditorSelection.create(ranges),
	});

	return true;
};

/**
 * Execute the contents of the editor as a GraphQL query
 */
export const executeGraphqlEditorQuery: Command = () => {
	const connection = getConnection();

	if (!connection) {
		return false;
	}

	const params = tryParseParams(connection.graphqlVariables);

	executeGraphql(connection.graphqlQuery, params);

	return true;
};
