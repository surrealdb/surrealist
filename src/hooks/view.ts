import { useEffect } from "react";
import { useConfigStore } from "~/stores/config";
import type { ViewMode } from "~/types";
import { useStable } from "./stable";

/**
 * Accepts a function to invoke when the specified view
 * is activated.
 *
 * @param view The view to listen for
 * @param callback The function to invoke
 */
export function useViewEffect(
	view: ViewMode,
	callback: () => void,
	deps: any[] = [],
) {
	const activeView = useConfigStore((s) => s.activeView);
	const stable = useStable(callback);

	useEffect(() => {
		if (activeView === view) {
			stable();
		}
	}, [activeView, view, ...deps]);
}
