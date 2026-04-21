import { fetchAPI } from "~/cloud/api";
import { useCloudStore } from "~/stores/cloud";
import type { CloudBillingCountry, CloudInstanceType, CloudRegion } from "~/types";

/**
 * Synchronise remote cloud resources with the local store.
 */
export async function syncCloudResources() {
	const { setCloudValues } = useCloudStore.getState();

	const [instanceVersions, instanceTypes, instanceRegions, contextRegions, billingCountries] =
		await Promise.all([
			fetchAPI<string[]>("/instanceversions"),
			fetchAPI<CloudInstanceType[]>("/instancetypes"),
			fetchAPI<CloudRegion[]>("/regions"),
			fetchAPI<CloudRegion[]>("/context_regions"),
			fetchAPI<CloudBillingCountry[]>("/billingcountries"),
		]);

	setCloudValues({
		instanceVersions,
		instanceTypes,
		instanceRegions,
		contextRegions,
		billingCountries,
	});
}
