import { encodeCbor } from "surrealdb.js";
import { SurrealQL, Value } from "surrealql.wasm/v1";

(window as any).SurrealQL = SurrealQL;

/**
 * Validate a query and return an error message if invalid
 */
export function validateQuery(sql: string): string | undefined {
	try {
		SurrealQL.validate(sql);
		return undefined;
	} catch(err: any) {
		return err.message;
	}
}

/**
 * Validate a record id and return an error message if invalid
 */
export function validateThing(thing: string): string | undefined {
	try {
		SurrealQL.validate_thing(thing);
		return undefined;
	} catch(err: any) {
		return err.message;
	}
}

/**
 * Validate a where clause and return an error message if invalid
 */
export function validateWhere(where: string): string | undefined {
	try {
		SurrealQL.validate_where(where);
		return undefined;
	} catch(err: any) {
		return err.message;
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
export function formatValue(value: any, json: boolean = false, pretty: boolean = false) {
	const binary = new Uint8Array(encodeCbor(value));
	const parsed = Value.from_cbor(binary);

	return parsed[json ? 'json' : 'format'](pretty);
}

export function formatQuery(query: string) {
	const formatted = SurrealQL.format(query, false);

	let output = '';
	let indent = 0;
	let skipSpace = false;
	const containedIn: string[] = [];

	const newline = () => {
		output += '\n' + ' '.repeat(indent * 4);
		skipSpace = true;
	};

	const seek = (i: number, text: string) => {
		return formatted.slice(i, i + text.length) === text;
	};

	for (let i = 0; i < formatted.length; i++) {
		const char = formatted.charAt(i);
		let doNewline = false;

		if (char == ' ' && skipSpace) {
			continue;
		}

		if (["{", "["].includes(containedIn.at(-1) as string) &&  char == ',') {
			doNewline = true;
		} else if (char == '{' || char == '(' || char == '[') {
			indent++;
			doNewline = true;
			containedIn.push(char);
		} else if (char == '}' || char == ')' || char == ']') {
			indent--;
			newline();
			containedIn.pop();
		}

		if (seek(i, 'WHERE') || seek(i, 'ORDER') || seek(i, 'GROUP') || seek(i, 'START') || seek(i, 'LIMIT') || seek(i, 'AND') || seek(i, 'OR')) {
			newline();
		}

		output += char;

		if (char == ';') {
			output += '\n';
		} else if (doNewline) {
			newline();
		} else if (skipSpace) {
			skipSpace = false;
		}
	}

	return output;
}