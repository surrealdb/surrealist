import { useEffect, useMemo } from "react";
import { PathPattern, matchRoute, useRouter, useSearch } from "wouter";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import { SANDBOX } from "~/constants";
import { useConfigStore } from "~/stores/config";
import type { ViewPage } from "~/types";
import { getActiveConnection, getConnection, getConnectionById } from "~/util/connection";
import { IntentEvent } from "~/util/global-events";
import { type IntentPayload, type IntentType, consumeIntent } from "~/util/intents";
import { useConnectionList } from "./connection";
import { useEventSubscription } from "./event";
import { useStable } from "./stable";

/**
 * Returns the current location and a function to navigate
 */
export function useAbsoluteLocation() {
	const router = useRouter();

	return router.hook(router);
}

/**
 * Returns the current location and a function to navigate
 */
export function useAbsoluteRoute<RoutePath extends PathPattern = PathPattern>(pattern: RoutePath) {
	return matchRoute(useRouter().parser, pattern, useAbsoluteLocation()[0]);
}

/**
 * Returns the active connection and view
 */
export function useConnectionAndView() {
	if (adapter instanceof MiniAdapter) {
		return [SANDBOX, "query"] as const;
	}

	const [match, params] = useAbsoluteRoute("/c/:connection/:view");

	if (!match) {
		return [null, null] as const;
	}

	return [params.connection, params.view as ViewPage] as const;
}

/**
 * Returns a function used to navigate to a specific connection and optional view
 */
export function useConnectionNavigator() {
	const [, navigate] = useAbsoluteLocation();

	return useStable((connection: string, view?: ViewPage) => {
		const info = getConnectionById(connection);

		if (info) {
			const fallback = info.authentication.mode === "cloud" ? "dashboard" : "query";

			navigate(`/c/${info.id}/${view ?? fallback}`);
		}
	});
}

/**
 * Listen to the specified intent and invoke the handler when it is dispatched.
 *
 * @param type The intent type to listen for
 * @param handler The handler to invoke when the intent is dispatched
 */
export function useIntent(type: IntentType, handler: (payload: IntentPayload) => void) {
	const handleIntent = useStable(() => {
		for (let intent = consumeIntent(type); intent; intent = consumeIntent(type)) {
			handler(intent.payload || {});
		}
	});

	useEffect(() => handleIntent(), []);
	useEventSubscription(IntentEvent, handleIntent);
}

/**
 * Subscribe to the URL search parameters
 */
export function useSearchParams() {
	const search = useSearch();

	return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}

/**
 * Accepts a function to invoke when the specified view
 * is activated.
 *
 * @param view The view to listen for
 * @param callback The function to invoke
 */
export function useViewFocus(view: ViewPage, callback: () => void, deps: any[] = []) {
	const [, activeView] = useConnectionAndView();
	const stable = useStable(callback);

	// NOTE - should this be useLayoutEffect?
	useEffect(() => {
		if (activeView === view) {
			stable();
		}
	}, [activeView, view, ...deps]);
}
