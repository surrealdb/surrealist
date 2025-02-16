import { Alert, Paper } from "@mantine/core";
import type { ProvisionStepProps } from "../types";

export function ProvisionComputeUnitsStep({ details }: ProvisionStepProps) {
	// const instanceTypes = useAvailableInstanceTypes();

	// const minComputeUnits = instanceInfo?.compute_units?.min ?? 1;
	// const maxComputeUnits = instanceInfo?.compute_units?.max ?? 1;

	// const instanceType = useMemo(() => {
	// 	return instanceTypes.find((t) => t.slug === details.type);
	// }, [details.type, instanceTypes]);

	return (
		<Alert
			color="blue"
			title="Coming soon"
		>
			Custom compute node configurations are not yet available
		</Alert>

		// 	{/* {hasSingleCompute ? (
		// 			<Alert
		// 				color="blue"
		// 				title="Upgrade to use compute nodes"
		// 			>
		// 				Compute nodes are not customisable for free instances
		// 			</Alert>
		// 		) : (
		// 			<>
		// 				{instanceInfo && (
		// 					<>
		// 						<Text
		// 							fw={600}
		// 							fz="xl"
		// 							c="bright"
		// 						>
		// 							Your selected instance
		// 						</Text>
		// 						<InstanceType
		// 							type={instanceInfo}
		// 							inactive
		// 						/>
		// 					</>
		// 				)}
		// 				<Text
		// 					mt="xl"
		// 					fw={600}
		// 					fz="xl"
		// 					c="bright"
		// 				>
		// 					Desired compute nodes
		// 				</Text>

		// 				<CounterInput
		// 					value={units}
		// 					onChange={setUnits}
		// 					min={minComputeUnits}
		// 					max={maxComputeUnits}
		// 				/>
		// 			</>
		// 		)} */}

		// 	{instanceType && (
		// 		<>
		// 			<Divider my="md" />
		// 			<EstimatedCost
		// 				type={instanceType}
		// 				units={details.units}
		// 			/>
		// 		</>
		// 	)}

		// 	<StepActions
		// 		step={step}
		// 		onPrevious={onPrevious}
		// 		onContinue={onContinue}
		// 	/>
		// </Stack>
	);
}
