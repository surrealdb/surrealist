import { useSetting } from "./config";
import { useStable } from "./stable";
import { ValueMode } from "~/types";
import { formatValue } from "~/util/surrealql";

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