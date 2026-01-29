import { Tree } from "@lezer/common";
import { compareVersions } from "compare-versions";
import { SDB_3_0_0 } from "./versions";

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

/**
 * This is hard coded to the deal-store dataset and bad,
 * but will be replaced in Surrealist 4.0 with a fully dynamic system
 */
export function getDatasetURL(version: string) {
	const base = `https://datasets.surrealdb.com/datasets/surreal-deal-store`;
	const isV3 = compareVersions(version, SDB_3_0_0) >= 0;

	if (isV3) {
		return `${base}/mini-v3.surql`;
	}

	return `${base}/mini-v2.surql`;
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
