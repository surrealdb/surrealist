import { fork } from "radash";
import { useMemo } from "react";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import type { CloudInstance, CloudInstanceType } from "~/types";

/**
 * Split instance types into available and unavailable types
 */
export function useCloudTypeLimits(
	instances: CloudInstance[],
): (type: CloudInstanceType) => boolean {
	const current = useOrganization();
	const types = useAvailableInstanceTypes();

	const available = useMemo(
		() =>
			types.filter((type) => {
				if (!current) return false;

				const [free, paid] = fork(instances ?? [], (i) => i.type.price_hour === 0);
				const isFree = type.price_hour === 0;

				console.log(current);

				return isFree
					? free.length < current.max_free_instances
					: paid.length < current.max_paid_instances;
			}),
		[types, current, instances],
	);

	return (type) => available.includes(type);
}
