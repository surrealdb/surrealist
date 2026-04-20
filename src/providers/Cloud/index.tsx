import { useAuth0 } from "@auth0/auth0-react";
import type { PropsWithChildren } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { adapter } from "~/adapter";
import { acquireSession, checkSessionExpiry, invalidateSession } from "~/cloud/api/auth";
import { useCloudStore } from "~/stores/cloud";

/**
 * Establishes and maintains the SurrealDB Cloud session when the user is authenticated via Auth0.
 */
export function useCloudAuthentication() {
	const { isAuthenticated, isLoading, getAccessTokenSilently, logout } = useAuth0();
	const hasInitialised = useRef(false);

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (isAuthenticated && !hasInitialised.current) {
			hasInitialised.current = true;

			(async () => {
				try {
					const accessToken = await getAccessTokenSilently();
					await acquireSession(accessToken, false);
				} catch (err: unknown) {
					const message = err instanceof Error ? err.message : String(err);

					adapter.warn(
						"Auth",
						`Failed to acquire cloud session on init: ${message}`,
					);

					useCloudStore.getState().setSessionExpired(true);

					invalidateSession();
					await logout({ openUrl: false });
				}
			})();
		}
	}, [isAuthenticated, isLoading, logout, getAccessTokenSilently]);

	useLayoutEffect(() => {
		const interval = setInterval(checkSessionExpiry, 1000 * 60 * 3);
		return () => clearInterval(interval);
	}, []);
}

export function CloudProvider({ children }: PropsWithChildren) {
	useCloudAuthentication();
	return children;
}
