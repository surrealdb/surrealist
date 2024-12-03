import { IntentEvent } from "~/util/global-events";
import type { IntentPayload, IntentType } from "~/util/intents";
import { useEventSubscription } from "./event";
import type { CloudPage, ViewMode } from "~/types";
import { useLocation, useSearch } from "wouter";
import { CLOUD_PAGES, VIEW_MODES } from "~/constants";
import { useStable } from "./stable";
import { useMemo } from "react";

/**
 * Returns the active view mode and a function to set it
 */
export function useActiveView() {
	const [location, navigate] = useLocation();

	const activeView = Object.values(VIEW_MODES).find((view) => location.startsWith(`/${view}`));
	const setActiveView = useStable((view: ViewMode) => {
		navigate(`/${view}`);
	});

	return [activeView, setActiveView] as const;
}

/**
 * Returns the active cloud page and a function to set it
 */
export function useActiveCloudPage() {
	const [location, navigate] = useLocation();

	const activePage = Object.values(CLOUD_PAGES).find((info) =>
		location.startsWith(`/cloud/${info.id}`),
	);

	const setActivePage = useStable((view: CloudPage) => {
		navigate(`/cloud/${view}`);
	});

	return [activePage, setActivePage] as const;
}

/**
 * Listen to the specified intent and invoke the handler when it is dispatched.
 *
 * @param type The intent type to listen for
 * @param handler The handler to invoke when the intent is dispatched
 */
export function useIntent(type: IntentType, handler: (payload: IntentPayload) => void) {
	useEventSubscription(IntentEvent, (event) => {
		if (event.type === type) {
			handler(event.payload || {});
		}
	});
}

/**
 * Subscribe to the URL search parameters
 */
export function useSearchParams() {
	const search = useSearch();

	return useMemo(() => Object.fromEntries(new URLSearchParams(search)), [search]);
}
