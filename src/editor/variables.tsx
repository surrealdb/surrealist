import type { CompletionSource } from "@codemirror/autocomplete";
import type { Extension } from "@codemirror/state";
import { surrealqlLanguage } from "@surrealdb/codemirror";
import { getActiveQuery } from "~/util/connection";
import { tryParseParams } from "~/util/helpers";

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
		options: variables.map((variable) => ({
			label: `$${variable}`,
			type: "variable",
		})),
	};
};

/**
 * An extension used to autocomplete query variables
 */
export const surqlVariableCompletion = (): Extension => {
	return surrealqlLanguage.data.of({
		autocomplete: VARIABLE_SOURCE,
	});
};
