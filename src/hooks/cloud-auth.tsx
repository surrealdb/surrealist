import { useAuth0 } from "@auth0/auth0-react";
import { adapter, isDesktop } from "~/adapter";
import { destroySession, invalidateSession } from "~/cloud/api/auth";
import { AUTH_LAUNCH_URL, AUTH_RETURN_URL } from "~/providers/Auth0";
import { useStable } from "./stable";

/**
 * Provides signIn, signOut, and invalidateSession actions backed by Auth0 SDK.
 */
export function useCloudAuth() {
	const auth0 = useAuth0();

	const signIn = useStable(async () => {
		await auth0.loginWithRedirect({
			openUrl: adapter.openUrl,
			authorizationParams: {
				redirect_uri: isDesktop ? AUTH_LAUNCH_URL : AUTH_RETURN_URL,
			},
		});
	});

	const signOut = useStable(() => {
		destroySession();
		auth0.logout({
			openUrl: adapter.openUrl,
			logoutParams: {
				returnTo: isDesktop ? AUTH_LAUNCH_URL : AUTH_RETURN_URL,
			},
		});
	});

	return {
		signIn,
		signOut,
		invalidateSession,
		auth0,
	};
}
