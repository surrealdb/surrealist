import { Skeleton } from "@mantine/core";
import { InstanceTypes } from "~/components/InstanceTypes";
import { useOrganizations } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import type { ProvisionStepProps } from "../types";

export function ProvisionCategoryStep({ details, setDetails }: ProvisionStepProps) {
	const organizations = useOrganizations();
	const organization = organizations.find((org) => org.id === details.organization);
	const instanceTypes = organization?.plan.instance_types ?? [];

	const updateType = useStable((type: string) => {
		const info = instanceTypes.find((t) => t.slug === type);

		if (!info) {
			return;
		}

		setDetails((draft) => {
			draft.type = info.slug;
			draft.units = info.compute_units.min ?? 1;

			if (info.price_hour === 0) {
				draft.storage_mode = "standalone";
			}
		});
	});

	return organization ? (
		<InstanceTypes
			value={details.type}
			organization={organization}
			onChange={(value) => updateType(value)}
		/>
	) : (
		<Skeleton h={52} />
	);
}
