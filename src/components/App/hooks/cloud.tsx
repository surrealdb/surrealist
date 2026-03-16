import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import {
	acquireSession,
	checkSessionExpiry,
	invalidateSession,
	openCloudAuthentication,
} from "~/cloud/api/auth";
import type { Auth0Handle } from "~/cloud/api/auth";
import { useEventSubscription } from "~/hooks/event";
import { useIntent } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import { featureFlags } from "~/util/feature-flags";
import { DeepLinkAuthEvent } from "~/util/global-events";

/**
 * Automatically set up the cloud authentication flow
 */
export function useCloudAuthentication() {
	const {
		isAuthenticated,
		isLoading,
		error,
		getAccessTokenSilently,
		handleRedirectCallback,
		loginWithRedirect,
		logout,
	} = useAuth0();

	const wasAuthenticated = useRef(false);
	const awaitingInitialLogin = useRef(false);

	const auth0Handle: Auth0Handle = useMemo(
		() => ({ loginWithRedirect, logout, getAccessTokenSilently }),
		[loginWithRedirect, logout, getAccessTokenSilently],
	);

	useEffect(() => {
		if (error) {
			adapter.log("Cloud", `Auth0 error: ${error.message}`);
			console.error("Auth0 error", error);
		}
	}, [error]);

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			wasAuthenticated.current = false;
			awaitingInitialLogin.current = true;

			const { setAuthState } = useCloudStore.getState();
			setAuthState("unauthenticated");
		}
	}, [isLoading, isAuthenticated]);

	useEffect(() => {
		if (isLoading || !isAuthenticated || wasAuthenticated.current) {
			return;
		}

		wasAuthenticated.current = true;

		const initial = awaitingInitialLogin.current;
		awaitingInitialLogin.current = false;

		(async () => {
			try {
				const { setLoading } = useCloudStore.getState();
				setLoading();

				const accessToken = await getAccessTokenSilently();
				await acquireSession(accessToken, initial);
			} catch (err) {
				console.error("Failed to acquire cloud session", err);
				invalidateSession();
			}
		})();
	}, [isAuthenticated, isLoading, getAccessTokenSilently]);

	useEffect(() => {
		const interval = setInterval(() => checkSessionExpiry(auth0Handle), 1000 * 60 * 3);
		return () => clearInterval(interval);
	}, [auth0Handle]);

	useEventSubscription(DeepLinkAuthEvent, async (authUrl) => {
		adapter.log("Cloud", "Received deep link auth callback");

		try {
			awaitingInitialLogin.current = true;
			await handleRedirectCallback(authUrl);
		} catch (err) {
			console.error("Failed to handle auth callback", err);
			invalidateSession();
		}
	});

	useIntent("cloud-signin", () => {
		openCloudAuthentication(auth0Handle);
	});

	useIntent("cloud-signout", () => {
		invalidateSession();
	});

	useIntent("cloud-activate", () => {
		featureFlags.set("cloud_access", true);
	});
}
