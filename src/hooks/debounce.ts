import { useEffect, useRef, useState } from "react";
import { useStable } from "./stable";
import { Value } from "surrealql.wasm/v1";
import { decodeCbor } from "surrealdb.js";

/**
 * Similar to useDebouncedCallback, however this hook will pass arguments to the callback
 *
 * @param exec The callback to execute
 * @param delay The delay in milliseconds
 * @returns The debounced callback
 */
export function useDebouncedFunction<F extends (...args: any) => any>(callback: F, delay: number): F {
	const task = useRef<any>(null);

	useEffect(() => {
		return () => {
			if (task.current) {
				clearTimeout(task.current);
			}
		};
	}, []);

	return useStable(((...value) => {
		if (task.current) {
			clearTimeout(task.current);
		}

		task.current = setTimeout(() => {
			task.current = null;
			callback(...value);
		}, delay);
	}) as F);
}

export function useDebouncedParsedObject<T>(delay: number, input: string) {
	const timeout = useRef<any>(null);
	const [parsed, setParsed] = useState<undefined | Record<string, unknown>>({});

	useEffect(() => {
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = setTimeout(() => {
			const parsed = decodeCbor(Value.from_string(input).to_cbor().buffer);
			if (typeof parsed == 'object' && !Array.isArray(parsed) && !parsed == null) {
				setParsed(parsed);
			} else {
				setParsed(undefined);
			}
		}, delay);
	}, [input]);

	return parsed;
}
