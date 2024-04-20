import { encodeCbor } from "surrealdb.js";
import { useSetting } from "./config";
import { useStable } from "./stable";
import { Value } from "surrealql.wasm/v1";
import { ValueMode } from "~/types";

export type Formatter = (value: any) => string;

/**
 * A hook used to format SurrealQL structures into strings
 */
export function useValueFormatter(): [Formatter, ValueMode] {
	const [mode] = useSetting("appearance", "valueMode");

	const format = useStable((value: any) => {
		const binary = new Uint8Array(encodeCbor(value));
		const parsed = Value.from_cbor(binary);

		return mode === "json"
			? parsed.json(true)
			: parsed.format(true);
	});

	return [format, mode];
}