import { useAuth0 } from "@auth0/auth0-react";

/**
 * Returns whether the user is authenticated via Auth0
 */
export function useIsAuthenticated() {
	return useAuth0().isAuthenticated;
}

/**
 * Returns whether the Auth0 SDK is still loading
 */
export function useIsAuthLoading() {
	return useAuth0().isLoading;
}
