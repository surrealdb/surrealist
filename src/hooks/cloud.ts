import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";

/**
 * Returns the actively selected organization
 */
export function useOrganization() {
	const orgs = useCloudStore(s => s.organizations);
	const active = useConfigStore(s => s.activeCloudOrg);

	return orgs.find(org => org.id === active);
}

/**
 * Returns whether the user is authenticated to Surreal Cloud
 */
export function useIsAuthenticated() {
	return useCloudStore(s => s.authState === "authenticated");
}

/**
 * Lists out the available regions for the current organization
 */
export function useAvailableRegions() {
	const current = useOrganization();
	const regions = useCloudStore(s => s.regions);
	const valid = new Set(current?.plan?.regions ?? []);

	return regions.filter(region => valid.has(region.slug));
}

/**
 * Lists out the available instance types for the current organization
 */
export function useAvailableInstanceTypes() {
	const current = useOrganization();
	const instanceTypes = useCloudStore(s => s.instanceTypes);
	const valid = new Set(current?.plan?.instance_types?.map(t => t.slug) ?? []);

	return instanceTypes.filter(type => valid.has(type.slug));
}