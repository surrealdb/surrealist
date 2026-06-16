import { Tree } from "@lezer/common";
import { parser } from "@surrealdb/lezer";

/**
 * Parse an indent and strip any escape characters
 *
 * @param ident The raw ident string
 * @returns The parsed ident
 */
export function parseIdent(ident: string) {
	const first = ident.at(0);
	const last = ident.at(-1);

	if (first === "`" && last === "`") {
		return ident.slice(1, -1).replaceAll("\\`", "`");
	}

	if (first === "⟨" && last === "⟩") {
		return ident.slice(1, -1).replaceAll("\\⟩", "⟩");
	}

	return ident;
}

/**
 * Compare two idents for equality, ignoring any escape characters
 *
 * @param a The first ident
 * @param b The second ident
 * @returns Whether the idents are equal
 */
export function compareIdents(a: string, b: string) {
	return parseIdent(a) === parseIdent(b);
}

const RESERVED_VARIABLES = new Set([
	"auth",
	"token",
	"access",
	"session",
	"before",
	"after",
	"value",
	"input",
	"this",
	"parent",
	"event",
]);

/**
 * Parse variables from the given SurrealQL tree
 *
 * @param tree The parse tree
 * @param extract The function to extract the variable name
 */
export function parseVariables(tree: Tree, extract: (from: number, to: number) => string) {
	const discovered = new Set<string>();

	tree.iterate({
		enter: (node) => {
			if (node.name === "LetStatementName") return false;
			if (node.name !== "VariableName") return;

			discovered.add(extract(node.from + 1, node.to));
		},
	});

	return [...discovered.values().filter((v) => !RESERVED_VARIABLES.has(v))];
}

const IGNORED_TOP_LEVEL_NODES = new Set(["Comment", "BlockComment"]);

/**
 * Count the number of top-level SurrealQL statements in a query.
 *
 * Uses the Lezer grammar so semicolons inside blocks (e.g. DEFINE FUNCTION bodies)
 * are not treated as statement boundaries.
 */
export function countQueryStatements(query: string) {
	if (!query.trim()) {
		return 1;
	}

	const tree = parser.parse(query);
	let count = 0;
	const cursor = tree.cursor();

	if (cursor.firstChild()) {
		do {
			if (IGNORED_TOP_LEVEL_NODES.has(cursor.name)) {
				continue;
			}

			count++;
		} while (cursor.nextSibling());
	}

	return Math.max(1, count);
}
