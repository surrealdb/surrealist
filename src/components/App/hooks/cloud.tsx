import {
	checkSessionExpiry,
	invalidateSession,
	openCloudAuthentication,
	refreshAccess,
	verifyAuthentication,
} from "~/cloud/api/auth";

import { useLayoutEffect } from "react";
import { adapter } from "~/adapter";
import { useIntent } from "~/hooks/routing";
import { featureFlags } from "~/util/feature-flags";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";

/**
 * Automatically set up the cloud authentication flow
 */
export function useCloudAuthentication() {
	// Check for session expiry every 3 minutes
	useLayoutEffect(() => {
		const responseCode = sessionStorage.getItem(CODE_RES_KEY);
		const responseState = sessionStorage.getItem(STATE_RES_KEY);

		// Check for configured redirect response, otherwise
		// attempt to refresh the currently active session
		if (responseCode && responseState) {
			sessionStorage.removeItem(CODE_RES_KEY);
			sessionStorage.removeItem(STATE_RES_KEY);

			verifyAuthentication(responseCode, responseState);
		} else {
			refreshAccess();
		}

		setInterval(checkSessionExpiry, 1000 * 60 * 3);
	}, []);

	// React to authentication intents
	useIntent("cloud-auth", (payload) => {
		const { code, state } = payload;

		if (!code || !state) {
			adapter.warn("Cloud", "Invalid cloud callback payload");
			return;
		}

		verifyAuthentication(code, state);
	});

	// React to signin intents
	useIntent("cloud-signin", () => {
		openCloudAuthentication();
	});

	// React to callback intents
	useIntent("cloud-signout", () => {
		invalidateSession();
	});

	// React to cloud activation
	useIntent("cloud-activate", () => {
		featureFlags.set("cloud_access", true);
	});
}
