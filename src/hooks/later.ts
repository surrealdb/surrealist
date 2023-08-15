import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Trigger a new render and invoke the passed function
 * during this next call. Useful when you require the component
 * state to be updated before dispatching an action.
 *
 * @param doLater The callback to invoke
 * @returns The function to trigger invocation
 */
export function useLater<T extends any[]>(doLater: (...args: T) => unknown): (...args: T) => void {
	const [shouldFire, setShouldFire] = useState(false);
	const argsRef = useRef<T>();

	useEffect(() => {
		if (shouldFire) {
			doLater(...argsRef.current!);
			setShouldFire(false);
		}
	}, [doLater, shouldFire]);

	return useCallback((...args) => {
		setShouldFire(true);
		argsRef.current = args;
	}, []);
}
