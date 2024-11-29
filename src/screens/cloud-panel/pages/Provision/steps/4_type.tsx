import { SimpleGrid, Stack, Text } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { ProvisionStepProps } from "../types";
import { InstanceType } from "~/screens/cloud-panel/components/InstanceType";
import { useCloudInstancesQuery } from "~/screens/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-panel/hooks/limits";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useMemo } from "react";
import { StepActions } from "../actions";

export function ProvisionInstanceTypesStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const instancesQuery = useCloudInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instancesQuery.data ?? []);

	const filteredTypes = useMemo(() => {
		if (!details.category) {
			return [];
		}

		return instanceTypes.filter((type) => type.category === details.category);
	}, [details.category, instanceTypes]);

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	return (
		<Stack>
			<PrimaryTitle>Select an instance type</PrimaryTitle>

			<Text mb="lg">
				Instance types define the resources allocated to your cloud instance. Choose a
				configuration that best fits your needs.
			</Text>

			<SimpleGrid cols={{ base: 1, md: 2 }}>
				{filteredTypes.map((type) => (
					<InstanceType
						key={type.slug}
						type={type}
						isActive={type.slug === details.type}
						isLimited={!isAvailable(type)}
						onSelect={() =>
							setDetails((draft) => {
								draft.type = type.slug;
								draft.units = type.compute_units.min ?? 1;
							})
						}
					/>
				))}
			</SimpleGrid>

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={onContinue}
				disabled={!details.type || details.category !== instanceType?.category}
			/>
		</Stack>
	);
}
