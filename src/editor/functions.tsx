import { type CompletionSource, snippetCompletion } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { surrealqlLanguage } from "@surrealdb/codemirror";
import { useDatabaseStore } from "~/stores/database";

const CUSTOM_FUNCTION_SOURCE: CompletionSource = (context) => {
	const match = context.matchBefore(/fn::\w*/i);
	const functions = useDatabaseStore.getState().connectionSchema.database.functions;
	const names = functions.map((fn) => `fn::${fn.name}`);

	if (!context.explicit && !match) {
		return null;
	}

	return {
		from: match ? match.from : context.pos,
		validFor: /[\w:]+$/,
		options: names.map((label) =>
			snippetCompletion(`${label}(#{1})`, {
				label,
				type: "function",
			}),
		),
	};
};

/**
 * An extension used to autocomplete table names
 */
export const surqlCustomFunctionCompletion = (): Extension => {
	return surrealqlLanguage.data.of({
		autocomplete: CUSTOM_FUNCTION_SOURCE,
	});
};
