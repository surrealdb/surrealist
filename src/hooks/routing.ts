import { useEffect, useMemo } from "react";
import { matchRoute, PathPattern, useRouter, useSearch } from "wouter";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";
import { SANDBOX } from "~/constants";
import type { ConnectionSettingsTab, ContextSettingsTab, ContextViewPage, ViewPage } from "~/types";
import { getConnectionById } from "~/util/connection";
import { connectionSettingsPath } from "~/util/connection-settings";
import { IntentEvent } from "~/util/global-events";
import { consumeIntent, type IntentPayload, type IntentType } from "~/util/intents";
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
 * Returns whether any of the provided match patterns match the current route.
 */
export function useRouteMatcher(match: string[]) {
	const parser = useRouter().parser;
	const [location] = useAbsoluteLocation();

	return match.some((m) => {
		return matchRoute(parser, m, location)[0];
	});
}

/**
 * Returns the active connection id from either a view or settings route.
 */
export function useConnectionFromRoute() {
	const [settingsMatch, settingsParams] = useAbsoluteRoute("/c/:connection/settings/:tab");
	const [viewMatch, viewParams] = useAbsoluteRoute("/c/:connection/:view");

	if (adapter instanceof MiniAdapter) {
		return SANDBOX;
	}

	if (settingsMatch) {
		return settingsParams.connection;
	}

	if (viewMatch) {
		return viewParams.connection;
	}

	return null;
}

/**
 * Returns the active connection and view
 */
export function useConnectionAndView() {
	const [match, params] = useAbsoluteRoute("/c/:connection/:view");

	if (adapter instanceof MiniAdapter) {
		return [SANDBOX, "query"] as const;
	}

	if (!match) {
		return [null, null] as const;
	}

	if (params.view === "settings") {
		return [params.connection, null] as const;
	}

	return [params.connection, params.view as ViewPage] as const;
}

/**
 * Returns the active connection settings tab, if any.
 */
export function useConnectionSettingsTab() {
	const [match, params] = useAbsoluteRoute("/c/:connection/settings/:tab");

	if (!match) {
		return [null, null] as const;
	}

	return [params.connection, params.tab as ConnectionSettingsTab] as const;
}

/**
 * Returns a function used to navigate to a connection settings tab.
 */
export function useConnectionSettingsNavigator() {
	const [, navigate] = useAbsoluteLocation();

	return useStable(
		(
			connection: string,
			tab: ConnectionSettingsTab,
			params?: Record<string, string | undefined>,
		) => {
			navigate(connectionSettingsPath(connection, tab, params));
		},
	);
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
 * Returns the active organisation id, context id, and view. Resolves both the
 * top-level view route and the nested settings route to the correct view id.
 */
export function useContextAndView() {
	const [settingsMatch, settingsParams] = useAbsoluteRoute(
		"/s/:organization/:context/settings/:tab",
	);
	const [viewMatch, viewParams] = useAbsoluteRoute("/s/:organization/:context/:view");

	if (settingsMatch) {
		return [settingsParams.organization, settingsParams.context, "settings"] as const;
	}

	if (viewMatch) {
		return [
			viewParams.organization,
			viewParams.context,
			viewParams.view as ContextViewPage,
		] as const;
	}

	return [null, null, null] as const;
}

/**
 * Returns the active context settings tab, if the current route is a context
 * settings sub-page.
 */
export function useContextSettingsTab() {
	const [match, params] = useAbsoluteRoute("/s/:organization/:context/settings/:tab");

	if (!match) {
		return null;
	}

	return params.tab as ContextSettingsTab;
}

/**
 * Returns a function used to navigate to a specific context and optional view
 */
export function useContextNavigator() {
	const [, navigate] = useAbsoluteLocation();

	return useStable(
		(
			organizationId: string,
			contextId: string,
			view?: ContextViewPage,
			params?: URLSearchParams,
		) => {
			const search = params ? `?${params.toString()}` : "";

			navigate(`/s/${organizationId}/${contextId}/${view ?? "dashboard"}${search}`);
		},
	);
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
