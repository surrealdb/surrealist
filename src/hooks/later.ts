import { useCallback, useEffect, useRef, useState } from "react";
import { useStable } from "./stable";

/**
 * Trigger a new render and invoke the passed function
 * during this next call. Useful when you require the component
 * state to be updated before dispatching an action.
 *
 * @param doLater The callback to invoke
 * @returns The function to trigger invocation
 */
export function useLater<T extends any[]>(
	doLater: (...args: T) => unknown,
): (...args: T) => void {
	const [shouldFire, setShouldFire] = useState(false);
	const argsRef = useRef<T>();

	const stableLater = useStable(doLater);

	useEffect(() => {
		if (shouldFire && argsRef.current) {
			stableLater(...argsRef.current);
			setShouldFire(false);
		}
	}, [shouldFire]);

	return useCallback((...args) => {
		setShouldFire(true);
		argsRef.current = args;
	}, []);
}
