import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { tryit } from "radash";
import type { ResultFormat } from "~/types";
import { extractKindRecords, formatValue, parseValue, validateWhere } from "~/util/surrealql";
import { useActiveQuery } from "./connection";
import { useStable } from "./stable";

export type Formatter = (value: any) => Promise<string>;

async function attemptFormat(format: Formatter, data: any): Promise<string> {
	const [err, res] = await tryit(format)(data);
	return err ? `"Error: ${err.message}"` : res;
}

/**
 * A hook used to format SurrealQL structures into strings
 */
export function useResultFormatter(): [Formatter, ResultFormat] {
	const query = useActiveQuery();
	const format = query?.resultFormat || "sql";

	const formatter = useStable(async (value: any) => {
		return await formatValue(value, format === "json", true);
	});

	return [formatter, format];
}

/**
 * Hook to format a value asynchronously using TanStack Query
 */
export function useFormatValue(value: any, json = false, pretty = false, enabled = true) {
	return useQuery({
		queryKey: ["format-value", value, json, pretty],
		queryFn: async () => await formatValue(value, json, pretty),
		enabled,
		staleTime: 5000, // Cache for 5 seconds
	});
}

/**
 * Hook to parse a value asynchronously using TanStack Query
 */
export function useParseValue(value: string, enabled = true) {
	const [debouncedValue] = useDebouncedValue(value, 250);

	return useQuery({
		queryKey: ["parse-value", debouncedValue],
		queryFn: async () => await parseValue(debouncedValue),
		enabled: enabled && !!debouncedValue,
		retry: false,
		staleTime: 5000,
	});
}

/**
 * Hook to validate a where clause using TanStack Query
 */
export function useValidateWhere(where: string, enabled = true) {
	const [debouncedWhere] = useDebouncedValue(where, 250);

	return useQuery({
		queryKey: ["validate-where", debouncedWhere],
		queryFn: async () => {
			const error = await validateWhere(debouncedWhere);
			return { isValid: !error, error };
		},
		enabled: enabled && !!debouncedWhere,
		retry: false,
		staleTime: 5000,
	});
}

/**
 * Returns whether the given value is valid SurrealQL or not
 *
 * @param value The value to check
 * @param objectRoot Whether the value should be an object
 */
export function useValueValidator(value: string, objectRoot?: boolean): [boolean, any, boolean] {
	const [bodyCache] = useDebouncedValue(value, 250);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["validate-value", bodyCache, objectRoot],
		queryFn: async () => {
			const parsedValue = await parseValue(bodyCache);

			if (objectRoot && typeof parsedValue !== "object" && !Array.isArray(parsedValue)) {
				throw new Error("Invalid object root");
			}

			return parsedValue;
		},
		enabled: !!bodyCache,
		retry: false,
		staleTime: 5000,
	});

	return [!isError && !!data, data ?? {}, isLoading];
}

/**
 * Hook to format a result using the formatter with error handling
 */
export function useFormatResult(format: Formatter, data: any, enabled = true) {
	return useQuery({
		queryKey: ["format-result", data, format],
		queryFn: async () => await attemptFormat(format, data),
		enabled,
		staleTime: 5000,
	});
}

/**
 * Hook to extract kind records from a field kind
 */
export function useExtractKindRecords(kind: string | undefined, enabled = true) {
	return useQuery({
		queryKey: ["extract-kind-records", kind],
		queryFn: async () => {
			if (!kind) return [];
			return await extractKindRecords(kind);
		},
		enabled: enabled && !!kind,
		staleTime: 60000, // Cache for 1 minute since field kinds don't change often
	});
}
