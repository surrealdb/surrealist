import { Tree } from "@lezer/common";
import { SurrealQL, Value } from "@surrealdb/ql-wasm";
import { decodeCbor, encodeCbor } from "surrealdb";
import { DATASETS } from "~/constants";
import { DatasetType } from "~/types";

/**
 * Validate a query and return an error message if invalid
 */
export function validateQuery(sql: string): string | undefined {
	try {
		SurrealQL.validate(sql);
		return undefined;
	} catch (err: any) {
		return err;
	}
}

/**
 * Validate a record id and return an error message if invalid
 */
export function validateThing(thing: string): string | undefined {
	try {
		SurrealQL.validate_thing(thing);
		return undefined;
	} catch (err: any) {
		return err;
	}
}

/**
 * Validate a where clause and return an error message if invalid
 */
export function validateWhere(where: string): string | undefined {
	try {
		(window as any).SurrealQL = SurrealQL;
		SurrealQL.validate_where(where);
		return undefined;
	} catch (err: any) {
		return err;
	}
}

/**
 * Returns the amount of statements in a query
 */
export function getStatementCount(sql: string): number {
	return SurrealQL.parse(sql).length;
}

/**
 * Format a value structure to a JSON or SQL string
 *
 * @param value The value to format
 * @param type Optionally output as JSON
 * @param pretty Optionally pretty print
 * @returns The formatted value
 */
export function formatValue(value: any, json = false, pretty = false) {
	const binary = new Uint8Array(encodeCbor(value));
	const parsed = Value.from_cbor(binary);

	return parsed[json ? "json" : "format"](pretty);
}

/**
 * Parse an SQL string back into a value structure
 *
 * @param value The value string
 * @returns The parsed value structure
 */
export function parseValue(value: string) {
	return decodeCbor(Value.from_string(value).to_cbor().buffer);
}

/**
 * Return the the indexes of the live query statements in the given query
 *
 * @param query The query to parse
 * @returns The indexes of the live query statements
 */
export function getLiveQueries(query: string): number[] {
	const tree: any[] = SurrealQL.parse(query);

	return tree.reduce((acc: number[], stmt, idx) => {
		if (stmt.Live) {
			acc.push(idx);
		}

		return acc;
	}, []);
}

/**
 * Format the given query
 *
 * @param query Query string
 * @returns Formatted query
 */
export function formatQuery(query: string, pretty = true) {
	return SurrealQL.format(query, pretty);
}

/**
 * Extract the kind records from the given kind
 *
 * @param kind The kind to extract records from
 * @returns The extracted records
 */
export function extractKindRecords(kind: string) {
	try {
		const ast = SurrealQL.parse(`DEFINE FIELD dummy ON dummy TYPE ${kind}`);
		const root = ast[0].Define.Field.kind;
		const records = new Set<string>();

		parseKindTree(root, records);

		return [...records.values()];
	} catch (err: any) {
		console.error(err);
		return [];
	}
}

function parseKindTree(obj: any, records: Set<string>) {
	if (!obj) return;

	if (obj.Record) {
		for (const record of obj.Record) {
			records.add(record);
		}
	} else if (obj.Array) {
		parseKindTree(obj.Array[0], records);
	} else if (obj.Set) {
		parseKindTree(obj.Array[0], records);
	} else if (obj.Either) {
		for (const either of obj.Either) {
			parseKindTree(either, records);
		}
	}
}

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
 * Parse a dataset URL from a source string
 *
 * @param source A path to a dataset or known dataset identifier
 * @returns The dataset URL
 */
export function parseDatasetURL(source: DatasetType) {
	const path = source.startsWith("/") ? source : DATASETS[source]?.path;

	if (!path) {
		throw new Error("Invalid dataset source");
	}

	return new URL(path, "https://datasets.surrealdb.com");
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
