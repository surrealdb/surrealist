import { useWindowEvent, useDidUpdate } from "@mantine/hooks";
import posthog from "posthog-js";
import { sift } from "radash";
import { useMemo, useEffect } from "react";
import { VIEW_MODES, CLOUD_PAGES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { ViewMode, CloudPage } from "~/types";
import { handleIntentRequest } from "~/util/intents";

const VIEWS = Object.keys(VIEW_MODES);
const CLOUDS = Object.keys(CLOUD_PAGES);

function isViewMode(value: any): value is ViewMode {
	return value && VIEWS.includes(value);
}

function isCloudPage(value: any): value is CloudPage {
	return value && CLOUDS.includes(value);
}

/**
 * Synchronize the active view and cloud page with the URL path.
 */
export function useConfigRouting() {
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