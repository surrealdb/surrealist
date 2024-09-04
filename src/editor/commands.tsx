import { startCompletion } from "@codemirror/autocomplete";
import { Command, EditorView } from "@codemirror/view";
import { executeGraphql, executeUserQuery } from "~/screens/database/connection/connection";
import { getActiveConnection } from "~/util/connection";
import { tryParseParams } from "~/util/helpers";

/**
 * Execute the contents of the editor as a query
 */
export const executeEditorQuery: Command = (view: EditorView) => {
	console.log(1);
	const query = view.state.doc.toString();
	const selection = view.state.selection.main;

	executeUserQuery({
		override: selection?.empty === false
			? query.slice(selection.from, selection.to)
			: query
	});

	return true;
};

/**
 * Execute the contents of the editor as a GraphQL query
 */
export const executeGraphqlEditorQuery: Command = () => {
	const connection = getActiveConnection();
	const params = tryParseParams(connection.graphqlVariables);

	executeGraphql(connection.graphqlQuery, params);

	return true;
};

/**
 * Suggest completions at the start of each line
 */
export const suggestCompletions: Command = (view: EditorView) => {
	setTimeout(() => startCompletion(view));
	return false;
};