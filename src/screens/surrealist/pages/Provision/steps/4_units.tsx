import { Alert, Divider, Stack, Text } from "@mantine/core";
import { useMemo } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { EstimatedCost } from "~/screens/surrealist/cloud-panel/components/EstimatedCost";
import { StepActions, StepTitle } from "../actions";
import type { ProvisionStepProps } from "../types";

export function ProvisionComputeUnitsStep({
	step,
	details,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const instanceTypes = useAvailableInstanceTypes();

	// const minComputeUnits = instanceInfo?.compute_units?.min ?? 1;
	// const maxComputeUnits = instanceInfo?.compute_units?.max ?? 1;

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	return (
		<Stack>
			<StepTitle description="Customise the number of compute nodes for your instance" />

			<Alert
				color="blue"
				title="Coming soon"
			>
				Compute node customisation will be available soon
			</Alert>

			{/* {hasSingleCompute ? (
					<Alert
						color="blue"
						title="Upgrade to use compute nodes"
					>
						Compute nodes are not customisable for free instances
					</Alert>
				) : (
					<>
						{instanceInfo && (
							<>
								<Text
									fw={600}
									fz="xl"
									c="bright"
								>
									Your selected instance
								</Text>
								<InstanceType
									type={instanceInfo}
									inactive
								/>
							</>
						)}
						<Text
							mt="xl"
							fw={600}
							fz="xl"
							c="bright"
						>
							Desired compute nodes
						</Text>

						<CounterInput
							value={units}
							onChange={setUnits}
							min={minComputeUnits}
							max={maxComputeUnits}
						/>
					</>
				)} */}

			{instanceType && (
				<>
					<Divider my="md" />
					<EstimatedCost
						type={instanceType}
						units={details.units}
					/>
				</>
			)}

			<StepActions
				step={step}
				onPrevious={onPrevious}
				onContinue={onContinue}
			/>
		</Stack>
	);
}
