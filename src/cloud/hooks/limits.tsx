import { fork } from "radash";
import { useMemo } from "react";
import type { CloudInstance, CloudInstanceType, CloudOrganization } from "~/types";

/**
 * Split instance types into available and unavailable types
 */
export function useCloudTypeLimits(
	instances: CloudInstance[],
	organization?: CloudOrganization,
): (type: CloudInstanceType) => boolean {
	const types = organization?.plan.instance_types ?? [];

	const available = useMemo(() => {
		if (!organization) {
			return [];
		}

		return types.filter((type) => {
			const [free, paid] = fork(instances ?? [], (i) => i.type.price_hour === 0);
			const isFree = type.price_hour === 0;

			return isFree
				? free.length < organization.max_free_instances
				: paid.length < organization.max_paid_instances;
		});
	}, [types, organization, instances]);

	return (type) => available.includes(type);
}
