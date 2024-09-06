import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import { getSetting } from "~/util/config";
import { validateQuery } from "~/util/surrealql";

/**
 * SurrealQL error linting
 */
export const surqlLinting = (): Extension =>
	linter((view) => {
		const isEnabled = getSetting("behavior", "queryErrorChecker");
		const content = view.state.doc.toString();

		if (!isEnabled || !content) {
			return [];
		}

		const message = validateQuery(content) || "";
		const match = message.match(
			/parse error: (failed to parse query at line (\d+) column (\d+).+)\n/i,
		);

		if (match) {
			const reason = match[1].trim();
			const lineNumber = Number.parseInt(match[2]);
			const column = Number.parseInt(match[3]);

			const position = view.state.doc.line(lineNumber).from + column - 1;
			const word = view.state.wordAt(position);

			return [
				word
					? {
							from: word.from,
							to: word.to,
							message: reason,
							severity: "error",
							source: "SurrealQL",
						}
					: {
							from: position,
							to: position + 1,
							message: reason,
							severity: "error",
							source: "SurrealQL",
						},
			];
		}

		return [];
	});
