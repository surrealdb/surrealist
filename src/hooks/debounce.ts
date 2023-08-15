import { useEffect, useRef } from "react";
import { useStable } from "./stable";

/**
 * Execute a callback after a delay, if the callback is called again before the delay is over, the delay is reset.
 *
 * @param delay The delay in milliseconds
 * @param exec The callback to execute
 * @returns The debounced callback
 */
export function useDebouncedCallback<T>(delay: number, exec: (value: T) => void): (value: T) => void {
	const task = useRef<any>(null);

	useEffect(() => {
		return () => {
			if (task.current) {
				clearTimeout(task.current);
			}
		};
	}, []);

	return useStable((value) => {
		if (task.current) {
			clearTimeout(task.current);
		}

		task.current = setTimeout(() => {
			task.current = null;
			exec(value);
		}, delay);
	});
}
