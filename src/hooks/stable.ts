import { useCallback, useRef } from "react";

/**
 * Wraps the given unstable function in a stable callback.
 *
 * @param callback The unstable callback function
 * @returns The stable callback
 */
export function useStable<T extends Function>(callback: T): T {
	const onChangeInner = useRef<any>();

	onChangeInner.current = callback;

	return useCallback<any>((...args: any) => {
		return onChangeInner.current(...args);
	}, []);
}
