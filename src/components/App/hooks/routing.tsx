import posthog from "posthog-js";
import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { useCloudRoute } from "~/hooks/cloud";
import { useSearchParams } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { handleIntentRequest } from "~/util/intents";
import { REFERRER_KEY } from "~/util/storage";

export function useAppRouter() {
	const { setActiveResource, setActiveScreen } = useConfigStore.getState();

	const [path, setPath] = useLocation();
	const { intent, referrer } = useSearchParams();
	const isCloud = useCloudRoute();
	const resource = useConfigStore((s) => s.activeResource);
	const screen = useConfigStore((s) => s.activeScreen);

	// Pageviews
	useLayoutEffect(() => {
		if (path !== "/") {
			posthog.capture("$pageview", {
				$current_url: path,
			});
		}
	}, [path]);

	// Restore active resource
	useLayoutEffect(() => {
		if (path === "/") {
			if (!resource || resource === "/") {
				setPath("/query");
			} else {
				setPath(resource);
			}
		} else {
			setActiveResource(path);
		}
	}, [path, resource, setActiveResource]);

	// Handle intent requests
	useLayoutEffect(() => {
		if (intent) {
			handleIntentRequest(intent);
		}
	}, [intent]);

	// Skip cloud screen
	useLayoutEffect(() => {
		if (screen === "start" && isCloud) {
			setActiveScreen("database");
		}
	}, [screen, isCloud, setActiveScreen]);

	// Cloud referral codes
	useLayoutEffect(() => {
		if (referrer) {
			sessionStorage.setItem(REFERRER_KEY, referrer);
		}
	}, [referrer]);
}
