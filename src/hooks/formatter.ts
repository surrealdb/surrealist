import { FormatOptions, format, formatRange } from "@surrealdb/surql-fmt";
import { useStable } from "@surrealdb/ui";
import { useSetting } from "./config";

export interface Formatters {
	format: (query: string) => string;
	formatRange: (query: string, from: number, to: number) => string;
}

/**
 * Access SurrealQL formatting functions configured based
 * on user preferences.
 */
export function useFormatter(): Formatters {
	const [formatIndentSize] = useSetting("appearance", "formatIndentSize");
	const [formatIndentMode] = useSetting("appearance", "formatIndentMode");
	const [formatMaxLineLength] = useSetting("appearance", "formatMaxLineLength");

	const options: FormatOptions = {
		indent: formatIndentMode === "space" ? formatIndentSize : 1,
		indentChar: formatIndentMode === "space" ? " " : "\t",
		maxLineLength: formatMaxLineLength,
	};

	const formatFn = useStable((query: string) => format(query, options));

	const formatRangeFn = useStable((query: string, from: number, to: number) =>
		formatRange(query, from, to, options),
	);

	return { format: formatFn, formatRange: formatRangeFn };
}
