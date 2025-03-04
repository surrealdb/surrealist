import posthog from "posthog-js";
import { useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { useSearchParams } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { handleIntentRequest } from "~/util/intents";
import { REFERRER_KEY } from "~/util/storage";

export function useAppRouter() {
	const { setActiveResource } = useConfigStore.getState();

	const [path, setPath] = useLocation();
	const { intent, referrer } = useSearchParams();
	const resource = useConfigStore((s) => s.activeResource);

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
				setPath("/overview");
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

	// Cloud referral codes
	useLayoutEffect(() => {
		if (referrer) {
			sessionStorage.setItem(REFERRER_KEY, referrer);
		}
	}, [referrer]);
}
