import { useEffect, useRef } from "react";
import { useStable } from "./stable";

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