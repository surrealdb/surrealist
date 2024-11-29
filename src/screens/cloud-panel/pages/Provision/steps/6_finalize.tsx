import { Paper, Stack, Table } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { ProvisionStepProps } from "../types";
import { StepActions } from "../actions";
import { useMemo } from "react";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { EstimatedCost } from "~/screens/cloud-panel/components/EstimatedCost";
import { useStable } from "~/hooks/stable";

export function ProvisionFinalizeStep({
	step,
	details,
	onPrevious,
	onContinue,
}: ProvisionStepProps) {
	const instanceTypes = useAvailableInstanceTypes();

	const instanceType = useMemo(() => {
		return instanceTypes.find((t) => t.slug === details.type);
	}, [details.type, instanceTypes]);

	const handlePrevious = useStable(() => {
		onPrevious(details.category === "free" ? 2 : undefined);
	});

	return (
		<Stack>
			<PrimaryTitle>Finalize your instance</PrimaryTitle>

			<Paper
				p="xl"
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Table>
					<Table.Tbody>
						<Table.Tr>
							<Table.Td>Name</Table.Td>
							<Table.Td c="bright">{details.name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Instance Type</Table.Td>
							<Table.Td c="bright">{instanceType?.display_name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Compute nodes</Table.Td>
							<Table.Td c="bright">
								{details.units} Node{details.units === 1 ? "" : "s"}
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Region</Table.Td>
							<Table.Td c="bright">{details.region}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Version</Table.Td>
							<Table.Td c="bright">{details.version}</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>

				{instanceType && (
					<EstimatedCost
						type={instanceType}
						units={details.units}
					/>
				)}
			</Paper>

			<StepActions
				step={step}
				onPrevious={handlePrevious}
				onContinue={onContinue}
			/>
		</Stack>
	);
}
