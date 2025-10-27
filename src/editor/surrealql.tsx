import { syntaxTree } from "@codemirror/language";
import { linter } from "@codemirror/lint";
import type { Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { getSurrealQL, hasSurrealQL } from "~/screens/surrealist/connection/connection";
import { getSetting } from "~/util/config";

const findStatement = (stack: any): [number, number] | null => {
	let last: any = null;

	for (let cur = stack; cur; cur = cur.next) {
		const { node } = cur;

		if (node.type.is("Statement") || node.type.is("BinaryExpression") || node.type.is("Path")) {
			last = cur;
		}
	}

	return last ? [last.node.from, last.node.to] : null;
};

/**
 * Returns the range of the query the cursor is currently in
 */
export const getQueryRange = (view: EditorView, head?: number): [number, number] | null => {
	const tree = syntaxTree(view.state);
	const cursor = head ?? view.state.selection.main.head;
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
 *
 * @param onValidate Callback to run when the query is validated
 */
export const surqlLinting = (onValidate?: (status: string) => void): Extension =>
	linter(
		async (view) => {
			const isEnabled = getSetting("behavior", "queryErrorChecker");
			const content = view.state.doc.toString();

			if (!isEnabled || !content || !hasSurrealQL()) {
				return [];
			}

			const message = (await getSurrealQL().validateQuery(content)) || "";
			const match = message.match(/^Parse error: (.+)?\s+-->\s+\[(\d+):(\d+)\]/i);

			if (match) {
				const reason = match[1].trim();
				const lineNumber = Number.parseInt(match[2]);
				const column = Number.parseInt(match[3]);

				const position = view.state.doc.line(lineNumber).from + column - 1;
				const word = view.state.wordAt(position);

				onValidate?.(reason);

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

			onValidate?.("");
			return [];
		},
		{
			delay: 250,
		},
	);
