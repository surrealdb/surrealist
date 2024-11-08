import { syntaxTree } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { getSetting } from "~/util/config";
import { validateQuery } from "~/util/surrealql";

const findStatement = (stack: any): [number, number] | null => {
	for (let cur = stack; cur; cur = cur.next) {
		const { node } = cur;

		if (node.type.is("Statement")) {
			return [node.from, node.to];
		}
	}

	return null;
};

/**
 * Returns the range of the query the cursor is currently in
 */
export const getQueryRange = (view: EditorView): [number, number] | null => {
	const tree = syntaxTree(view.state);
	const cursor = view.state.selection.main.head;
	const isTerm = view.state.sliceDoc(cursor - 1, cursor) === ";";

	// Find a query to the right
	const rightStack = tree.resolveStack(cursor, 1);
	const rightStatement = findStatement(rightStack);

	if (rightStatement) {
		return rightStatement;
	}

	// Find a query to the left, optionally skipping a semicolon
	const leftStack = tree.resolveStack(isTerm ? cursor - 1 : cursor, -1);
	const leftStatement = findStatement(leftStack);

	if (leftStatement) {
		return leftStatement;
	}

	return null;
};

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
