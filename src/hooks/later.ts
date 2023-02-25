import { useCallback, useEffect, useState } from "react";

/**
 * Trigger a new render and invoke the passed function
 * during this next call. Useful when you require the component
 * state to be updated before dispatching an action.
 * 
 * @param doLater The callback to invoke
 * @returns The function to trigger invocation
 */
export function useLater(doLater: () => unknown): () => void {
	const [shouldFire, setShouldFire] = useState(false);

	useEffect(() => {
		if (shouldFire) {
			doLater();
			setShouldFire(false);
		}
	}, [doLater, shouldFire]);

	return useCallback(() => {
		setShouldFire(true);
	}, []);
}