import { useEffect } from "react";
import { useConfigStore } from "~/stores/config";
import { useStable } from "./stable";
import { ViewMode } from "~/types";

/**
 * Accepts a function to invoke when the specified view
 * is activated.
 *
 * @param view The view to listen for
 * @param callback The function to invoke
 */
export function useViewEffect(view: ViewMode, callback: () => void, deps: any[] = []) {
	const activeView = useConfigStore(s => s.activeView);
	const stable = useStable(callback);

	useEffect(() => {
		if (activeView === view) {
			stable();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeView, view, stable, ...deps]);
}