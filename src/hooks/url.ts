import posthog from "posthog-js";
import { useDidUpdate, useWindowEvent } from "@mantine/hooks";
import { useEffect, useMemo } from "react";
import { CLOUD_PAGES, VIEW_MODES } from "~/constants";
import { useConfigStore } from "~/stores/config";
import { CloudPage, ViewMode } from "~/types";
import { IntentEvent } from "~/util/global-events";
import { useEventSubscription } from "./event";
import { IntentPayload, IntentType, getIntentView, handleIntentRequest } from "~/util/intents";
import { sift } from "radash";
import { useStable } from "./stable";

const VIEWS = Object.keys(VIEW_MODES);
const CLOUDS = Object.keys(CLOUD_PAGES);

/**
 * Sync the active view to the URL and handle incoming intents
 */
export function useUrlHandler() {
	const { setActiveView, setActiveCloudPage } = useConfigStore.getState();
	const activeView = useConfigStore((s) => s.activeView);
	const cloudPage = useConfigStore((s) => s.activeCloudPage);

	// The expected URL path based on the current state
	const actualPath = useMemo(() => {
		let urlPath = `/${activeView}`;

		if (activeView === "cloud") {
			urlPath += `/${cloudPage}`;
		}

		return urlPath;
	}, [activeView, cloudPage]);

	// Apply state based on the current URL path
	const applyState = useStable(() => {
		const [view, ...other] = sift(location.pathname.toLowerCase().split('/'));
		const params = new URLSearchParams(location.search);

		let repair = false;

		if (isViewMode(view)) {
			setActiveView(view);

			if (view === "cloud") {
				if (isCloudPage(other[0])) {
					setActiveCloudPage(other[0]);
				} else {
					repair = true;
				}
			}
		} else {
			repair = true;
		}

		if (repair) {
			console.log('repairing');
			history.replaceState(null, document.title, actualPath);
		}

		const intent = params.get('intent');

		if (intent) {
			handleIntentRequest(intent);
		}
	});

	// Sync initial URL to active view
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(applyState, []);

	// Sync history change to active view
	useWindowEvent('popstate', applyState);

	// Sync active view to URL
	useDidUpdate(() => {
		if (location.pathname !== actualPath) {
			history.pushState(null, document.title, actualPath);
			posthog.capture('$pageview');
		}
	}, [actualPath]);
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
 * Dispatch an intent with the specified payload
 *
 * @param intent The intent type to dispatch
 * @param payload Optional payload
 */
export function dispatchIntent(intent: IntentType, payload?: IntentPayload) {
	const { setActiveView } = useConfigStore.getState();
	const view = getIntentView(intent);

	if (view) {
		setActiveView(view);
	}

	IntentEvent.dispatch({ type: intent, payload });
}

function isViewMode(value: any): value is ViewMode {
	return value && VIEWS.includes(value);
}

function isCloudPage(value: any): value is CloudPage {
	return value && CLOUDS.includes(value);
}