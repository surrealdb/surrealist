import { CloudInstanceType, CloudOrganization } from "~/types";
import { useCloudOrganizationInstancesQuery } from "../queries/instances";
import { useStable } from "~/hooks/stable";
import { fork } from "radash";
import { useMemo } from "react";

export function useFreeInstanceTypeAvailable(organisation: CloudOrganization) {
	const { data } = useCloudOrganizationInstancesQuery(organisation.id);
	const freeCount = data?.filter((instance) => instance.type.price_hour === 0).length ?? 0;

	return freeCount < organisation.max_free_instances;
}

/**
 * Returns a map of all available instance types for the organization
 */
export function useInstanceTypeRegistry(organisation: CloudOrganization) {
	const flattened = organisation.available_plans.flatMap((plan) => plan.instance_types);

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

/**
 * Returns a function to check instance type availability based on the organization's limits.
 */
export function useInstanceTypeAvailable(organisation: CloudOrganization) {
	const { data } = useCloudOrganizationInstancesQuery(organisation.id);
	const instanceTypes = useInstanceTypeRegistry(organisation);

	return useStable((type: CloudInstanceType) => {
		if (!instanceTypes.has(type.slug)) {
			return false;
		}

		const [freeList, paidList] = fork(data ?? [], (i) => i.type.price_hour === 0);

		return type.price_hour === 0
			? freeList.length < organisation.max_free_instances
			: paidList.length < organisation.max_paid_instances;
	});
}
