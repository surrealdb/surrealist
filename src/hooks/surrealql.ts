import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
import type { ResultFormat } from "~/types";
import { formatValue, parseValue } from "~/util/surrealql";
import { useActiveQuery } from "./connection";
import { useStable } from "./stable";

export type Formatter = (value: any) => Promise<string>;

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
 * Returns whether the given value is valid SurrealQL or not
 *
 * @param value The value to check
 * @param objectRoot Whether the value should be an object
 */
export function useValueValidator(value: string, objectRoot?: boolean): [boolean, any, boolean] {
	const [bodyCache] = useDebouncedValue(value, 250);
	const [isValid, setIsValid] = useState(false);
	const [parsedValue, setParsedValue] = useState<any>({});
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		let cancelled = false;

		const validate = async () => {
			setIsLoading(true);
			try {
				const value = await parseValue(bodyCache);

				if (cancelled) return;

				if (objectRoot && typeof value !== "object" && !Array.isArray(value)) {
					throw new Error("Invalid object root");
				}

				setIsValid(true);
				setParsedValue(value);
			} catch {
				if (cancelled) return;
				setIsValid(false);
				setParsedValue({});
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		validate();

		return () => {
			cancelled = true;
		};
	}, [bodyCache, objectRoot]);

	return [isValid, parsedValue, isLoading];
}
