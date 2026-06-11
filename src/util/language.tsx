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

const DATASETS_CDN = "https://datasets.surrealdb.com";

/**
 * Known dataset identifiers passed to the mini embed (not filesystem paths).
 * Course content and docs use `/learn/...` paths instead; see `parseDatasetURL`.
 */
const NAMED_EMBED_DATASETS: Record<string, string> = {
	"surreal-deal-store-mini": "/surreal-deal-store-mini.surql",
};

/**
 * Resolve a dataset reference from a mini-embed URL parameter to a fetchable URL.
 *
 * - Absolute paths (`/learn/book/book-part-7-dataset.surql`) are served from
 *   [datasets.surrealdb.com](https://datasets.surrealdb.com).
 * - Named aliases (`surreal-deal-store-mini`) map to files on the same CDN.
 * - Full `http(s)://` URLs are passed through unchanged.
 */
export function parseDatasetURL(source: string): string {
	if (source.startsWith("http://") || source.startsWith("https://")) {
		return source;
	}

	const path = source.startsWith("/") ? source : NAMED_EMBED_DATASETS[source];

	if (!path) {
		throw new Error(`Invalid dataset source: ${source}`);
	}

	return new URL(path, DATASETS_CDN).href;
}

/**
 * Default in-app sample dataset for the sandbox, keyed by the embedded engine version.
 *
 * Used by the connection toolbar "Load dataset" action — not for mini-embed `dataset=`
 * parameters (those use `parseDatasetURL`).
 */
export function getDatasetURL(version: string) {
	const base = `${DATASETS_CDN}/datasets/surreal-deal-store`;
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
