import { useEffect } from "react";
import { useConfigStore } from "~/stores/config";
import type { ViewMode } from "~/types";
import { useActiveView } from "./routing";
import { useStable } from "./stable";

/**
 * Accepts a function to invoke when the specified view
 * is activated.
 *
 * @param view The view to listen for
 * @param callback The function to invoke
 */
export function useViewEffect(view: ViewMode, callback: () => void, deps: any[] = []) {
	const [activeView] = useActiveView();
	const stable = useStable(callback);

	useEffect(() => {
		if (activeView?.id === view) {
			stable();
		}
	}, [activeView, view, ...deps]);
}
