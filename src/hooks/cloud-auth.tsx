import { useAuth0 } from "@auth0/auth0-react";
import { useMemo } from "react";
import {
	destroySession,
	invalidateSession,
	openCloudAuthentication,
} from "~/cloud/api/auth";
import type { Auth0Handle } from "~/cloud/api/auth";
import { useStable } from "~/hooks/stable";

/**
 * Provides cloud authentication actions backed by the Auth0 SDK
 */
export function useCloudAuth() {
	const { loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();

	const auth0Handle: Auth0Handle = useMemo(
		() => ({ loginWithRedirect, logout, getAccessTokenSilently }),
		[loginWithRedirect, logout, getAccessTokenSilently],
	);

	const signIn = useStable(() => {
		openCloudAuthentication(auth0Handle);
	});

	const signOut = useStable(() => {
		destroySession(auth0Handle);
	});

	return {
		signIn,
		signOut,
		invalidateSession,
	};
}
