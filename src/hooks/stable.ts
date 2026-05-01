import { useCallback, useRef } from "react";

/**
 * Wraps the given unstable function in a stable callback.
 *
 * @param callback The unstable callback function
 * @returns The stable callback
 */
export function useStable<T extends (...rest: any[]) => any>(callback: T): T {
	const onChangeInner = useRef<any>(null);

	onChangeInner.current = callback;

	return useCallback<any>((...args: any) => {
		return onChangeInner.current(...args);
	}, []);
}
