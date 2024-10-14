// https://github.com/dmnd/dedent

// NOTE added ignoreNonIndentedLines

export interface DedentOptions {
	escapeSpecialCharacters?: boolean;
	ignoreNonIndentedLines?: boolean;
}

export interface Dedent {
	(literals: string): string;
	(strings: TemplateStringsArray, ...values: unknown[]): string;
	withOptions: CreateDedent;
}

export type CreateDedent = (options: DedentOptions) => Dedent;

export const dedent: Dedent = createDedent({});

function createDedent(options: DedentOptions) {
	dedent.withOptions = (newOptions: DedentOptions): Dedent =>
		createDedent({ ...options, ...newOptions });

	return dedent;

	function dedent(literals: string): string;
	function dedent(strings: TemplateStringsArray, ...values: unknown[]): string;
	function dedent(strings: TemplateStringsArray | string, ...values: unknown[]) {
		const raw = typeof strings === "string" ? [strings] : strings.raw;
		const { escapeSpecialCharacters = Array.isArray(strings), ignoreNonIndentedLines } =
			options;

		// first, perform interpolation
		let result = "";
		for (let i = 0; i < raw.length; i++) {
			let next = raw[i];

			if (escapeSpecialCharacters) {
				// handle escaped newlines, backticks, and interpolation characters
				next = next
					.replace(/\\\n[ \t]*/g, "")
					.replace(/\\`/g, "`")
					.replace(/\\\$/g, "$")
					.replace(/\\\{/g, "{");
			}

			result += next;

			if (i < values.length) {
				// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
				result += values[i];
			}
		}

		// now strip indentation
		const lines = result.split("\n");
		const linePattern = ignoreNonIndentedLines ? /^(\s+)\S+/ : /^(\s*)\S+/;
		let mindent: null | number = null;
		for (const l of lines) {
			const m = l.match(linePattern);
			if (m) {
				const indent = m[1].length;
				if (!mindent) {
					// this is the first indented line
					mindent = indent;
				} else {
					mindent = Math.min(mindent, indent);
				}
			}
		}

		if (mindent !== null) {
			const m = mindent; // appease TypeScript
			result = lines
				// https://github.com/typescript-eslint/typescript-eslint/issues/7140
				// eslint-disable-next-line @typescript-eslint/prefer-string-starts-ends-with
				.map((l) => (l[0] === " " || l[0] === "\t" ? l.slice(m) : l))
				.join("\n");
		}

		// dedent eats leading and trailing whitespace too
		result = result.trim();
		if (escapeSpecialCharacters) {
			// handle escaped newlines at the end to ensure they don't get stripped too
			result = result.replace(/\\n/g, "\n");
		}

		return result;
	}
}
