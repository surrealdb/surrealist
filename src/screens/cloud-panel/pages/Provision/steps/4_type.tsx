import { Alert, Collapse, Divider, SimpleGrid, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { EstimatedCost } from "~/screens/cloud-panel/components/EstimatedCost";
import { InstanceType } from "~/screens/cloud-panel/components/InstanceType";
import { useCloudInstancesQuery } from "~/screens/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-panel/hooks/limits";
import { iconWarning } from "~/util/icons";
import { StepActions } from "../actions";
import type { ProvisionStepProps } from "../types";

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

	const isUnavailable = instanceType && !isAvailable(instanceType);

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
						isSelected={type.slug === details.type}
						onSelect={() =>
							setDetails((draft) => {
								draft.type = type.slug;
								draft.units = type.compute_units.min ?? 1;
							})
						}
					/>
				))}
			</SimpleGrid>

			{isUnavailable && (
				<Alert
					color="orange"
					icon={<Icon path={iconWarning} />}
				>
					Maximum instance limit reached for this type
				</Alert>
			)}

			<Collapse in={!!instanceType}>
				<Divider my="md" />
				<EstimatedCost
					type={instanceType}
					units={details.units}
				/>
			</Collapse>

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={onContinue}
				disabled={
					!details.type || details.category !== instanceType?.category || isUnavailable
				}
			/>
		</Stack>
	);
}
