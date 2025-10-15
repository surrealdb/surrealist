import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import type { ResultFormat } from "~/types";
import { useActiveQuery } from "./connection";
import { useStable } from "./stable";

export type Formatter = (value: any) => string;

/**
 * A hook used to format SurrealQL structures into strings
 */
export function useResultFormatter(): [Formatter, ResultFormat] {
	const query = useActiveQuery();
	const format = query?.resultFormat || "sql";

	const formatter = useStable((value: any) => {
		return getSurrealQL().formatValue(value, format === "json", true);
	});

	return [formatter, format];
}

/**
 * Returns whether the given value is valid SurrealQL or not
 *
 * @param value The value to check
 * @param objectRoot Whether the value should be an object
 */
export function useValueValidator(value: string, objectRoot?: boolean): [boolean, any] {
	const [bodyCache] = useDebouncedValue(value, 250);

	return useMemo(() => {
		try {
			const value = getSurrealQL().parseValue(bodyCache);

			if (objectRoot && typeof value !== "object" && !Array.isArray(value)) {
				throw new Error("Invalid object root");
			}

			return [true, value];
		} catch {
			return [false, {}];
		}
	}, [bodyCache, objectRoot]);
}
