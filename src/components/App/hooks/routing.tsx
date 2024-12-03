import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { useSearchParams } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { handleIntentRequest } from "~/util/intents";

export function useAppRouter() {
	const { setActiveResource } = useConfigStore.getState();

	const [path, setPath] = useLocation();
	const { intent } = useSearchParams();
	const resource = useConfigStore((s) => s.activeResource);

	// Restore active resource
	useLayoutEffect(() => {
		if (path === "/") {
			setPath(resource ?? "/query");
		}

		setActiveResource(path);
	}, [path, resource, setActiveResource]);

	// Handle intent requests
	useLayoutEffect(() => {
		if (intent) {
			setPath(path, { replace: true });
			handleIntentRequest(intent);
		}
	}, [intent, path]);
}
