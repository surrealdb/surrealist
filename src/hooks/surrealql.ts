import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";
import { ValueMode } from "~/types";
import { formatValue, parseValue } from "~/util/surrealql";
import { useSetting } from "./config";
import { useStable } from "./stable";

export type Formatter = (value: any) => string;

/**
 * A hook used to format SurrealQL structures into strings
 */
export function useValueFormatter(): [Formatter, ValueMode] {
	const [mode] = useSetting("appearance", "valueMode");

	const format = useStable((value: any) => {
		return formatValue(value, mode === "json", true);
	});

	return [format, mode];
}

/**
 * Returns whether the given value is valid SurrealQL or not
 *
 * @param value The value to check
 * @param objectRoot Whether the value should be an object
 */
export function useValueValidator(
	value: string,
	objectRoot?: boolean,
): [boolean, any] {
	const [bodyCache] = useDebouncedValue(value, 250);

	return useMemo(() => {
		try {
			const value = parseValue(bodyCache);

			if (objectRoot && typeof value !== "object" && !Array.isArray(value)) {
				throw new Error("Invalid object root");
			}

			return [true, value];
		} catch {
			return [false, {}];
		}
	}, [bodyCache, objectRoot]);
}
