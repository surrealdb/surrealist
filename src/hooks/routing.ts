import { useEffect, useMemo } from "react";
import { useLocation, useRoute, useSearch } from "wouter";
import { VIEW_PAGES } from "~/constants";
import type { ViewPage } from "~/types";
import { IntentEvent } from "~/util/global-events";
import { type IntentPayload, type IntentType, consumeIntent } from "~/util/intents";
import { useEventSubscription } from "./event";
import { useStable } from "./stable";

/**
 * Returns the active connection ID
 */
export function useActiveConnection() {
	const [, navigate] = useLocation();
	const [match, params] = useRoute("/c/:connection/:view");
	const activeView = params?.view ?? "query";

	const activeConnection = match ? params.connection : null;
	const setActiveConnection = useStable((connection: string) => {
		navigate(`/c/${connection}/${activeView}`);
	});

	return [activeConnection, setActiveConnection] as const;
}

/**
 * Returns the active view mode and a function to set it
 */
export function useActiveView() {
	const [, navigate] = useLocation();
	const [match, params] = useRoute("/c/:connection/:view");
	const activeConnection = params?.connection ?? "";

	const activeView = match ? params.view : null;
	const setActiveView = useStable((view: ViewPage) => {
		navigate(`/c/${activeConnection}/${view}`);
	});

	return [activeView, setActiveView] as const;
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
	const [activeView] = useActiveView();
	const stable = useStable(callback);

	// NOTE - should this be useLayoutEffect?
	useEffect(() => {
		if (activeView?.id === view) {
			stable();
		}
	}, [activeView, view, ...deps]);
}
