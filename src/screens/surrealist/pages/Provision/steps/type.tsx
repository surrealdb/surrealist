import { useMemo } from "react";
import { useCloudTypeLimits } from "~/cloud/hooks/limits";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { InstanceTypes } from "~/components/InstanceTypes";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps } from "../types";

export function ProvisionCategoryStep({ details, setDetails }: ProvisionStepProps) {
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const instances = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instances.data ?? []);

	const freeType = useMemo(() => {
		return instanceTypes.find((type) => type.category === "free");
	}, [instanceTypes]);

	const updateType = useStable((type: string) => {
		const info = instanceTypes.find((t) => t.slug === type);

		if (!info) {
			return;
		}

		setDetails((draft) => {
			draft.type = info.slug;
			draft.units = info.compute_units.min ?? 1;
		});
	});

	const isFreeAvailable = freeType && isAvailable(freeType);
	const defaultCategory = isFreeAvailable ? "free" : "development";

	return (
		<InstanceTypes
			value={details.type}
			defaultCategory={defaultCategory}
			onChange={(value) => updateType(value)}
		/>
	);
}
