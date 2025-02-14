import { Alert, Box, Button, Collapse, Divider, SimpleGrid, Stack, Text } from "@mantine/core";
import { capitalize } from "radash";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { EstimatedCost } from "~/screens/surrealist/cloud-panel/components/EstimatedCost";
import { InstanceType } from "~/screens/surrealist/cloud-panel/components/InstanceType";
import { useCloudTypeLimits } from "~/cloud/hooks/limits";
import { iconChevronRight, iconWarning } from "~/util/icons";
import { StepActions, StepTitle } from "../actions";
import type { ProvisionStepProps } from "../types";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { useAbsoluteLocation } from "~/hooks/routing";

export function ProvisionInstanceTypesStep({
	step,
	details,
	setDetails,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const instancesQuery = useCloudOrganizationInstancesQuery(organization?.id);
	const isAvailable = useCloudTypeLimits(instancesQuery.data ?? []);
	const [, navigate] = useAbsoluteLocation();

	const hasBilling = (organization?.billing_info && organization?.payment_info) ?? false;

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
			<StepTitle
				title="Instance Type"
				description="Choose how many resources you need for your instance"
			/>

			{!hasBilling && details.category !== "free" && (
				<Alert
					mb="lg"
					color="blue"
					title={`Upgrade to use ${details.category} instances`}
				>
					<Box>
						{capitalize(details.category)} instances require a billing plan to be
						enabled.
					</Box>
					<Button
						rightSection={<Icon path={iconChevronRight} />}
						color="blue"
						size="xs"
						mt="md"
						onClick={() => navigate("/billing")}
					>
						Enter billing & payment details
					</Button>
				</Alert>
			)}

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
