import { useLayoutEffect } from "react";
import { adapter } from "~/adapter";
import {
	checkSessionExpiry,
	invalidateSession,
	refreshAccess,
	verifyAuthentication,
} from "~/screens/cloud-manage/api/auth";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";
import { CODE_RES_KEY, STATE_RES_KEY } from "~/util/storage";
import { useIntent } from "./url";

/**
 * Returns the actively selected organization
 */
export function useOrganization() {
	const orgs = useCloudStore((s) => s.organizations);
	const active = useConfigStore((s) => s.activeCloudOrg);

	return orgs.find((org) => org.id === active);
}

/**
 * Returns whether the user is authenticated to Surreal Cloud
 */
export function useIsAuthenticated() {
	return useCloudStore((s) => s.authState === "authenticated");
}

/**
 * Lists out the available regions for the current organization
 */
export function useAvailableRegions() {
	const current = useOrganization();
	const regions = useCloudStore((s) => s.regions);
	const valid = new Set(current?.plan?.regions ?? []);

	return regions.filter((region) => valid.has(region.slug));
}

/**
 * Lists out the available instance types for the current organization
 */
export function useAvailableInstanceTypes() {
	const current = useOrganization();
	
	return current?.plan.instance_types ?? [];
}

/**
 * Lists out the available instance versions
 */
export function useAvailableInstanceVersions() {
	return useCloudStore((s) => s.instanceVersions);
}

/**
 * Automatically set up the cloud authentication flow
 */
export function useCloudAuthentication() {
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

		// Automatically refresh the session before it expires
		setInterval(
			() => {
				checkSessionExpiry();
			},
			1000 * 60 * 3,
		);
	}, []);

	// React to signin intents
	useIntent("cloud-signin", (payload) => {
		const { code, state } = payload;

		if (!code || !state) {
			adapter.warn("Cloud", "Invalid cloud callback payload");
			return;
		}

		verifyAuthentication(code, state);
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
