import { useMemo } from "react";
import { CloudInstanceType, CloudOrganization } from "~/types";
import { useCloudOrganizationInstancesQuery } from "../queries/instances";

export function useFreeInstanceTypeAvailable(organisation: CloudOrganization) {
	const { data } = useCloudOrganizationInstancesQuery(organisation.id);
	const freeCount = data?.filter((instance) => instance.type.price_hour === 0).length ?? 0;

	return freeCount < organisation.max_free_instances;
}

/**
 * Returns a map of all available instance types for the organization
 */
export function useInstanceTypeRegistry(organisation?: CloudOrganization) {
	const flattened = organisation?.available_plans.flatMap((plan) => plan.instance_types) ?? [];

	return useMemo(() => {
		const instanceTypes = new Map<string, CloudInstanceType>();

		for (const type of flattened) {
			if (!instanceTypes.has(type.slug)) {
				instanceTypes.set(type.slug, type);
			}
		}

		return instanceTypes;
	}, [flattened]);
}
