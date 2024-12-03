import { Divider, Paper, Stack, Table } from "@mantine/core";
import { useMemo } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { EstimatedCost } from "~/screens/cloud-panel/components/EstimatedCost";
import { StepActions } from "../actions";
import type { ProvisionStepProps } from "../types";

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
			<PrimaryTitle>Confirm configuration</PrimaryTitle>

			<Paper
				p="lg"
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Table>
					<Table.Tbody>
						<Table.Tr>
							<Table.Td pb="sm">Name</Table.Td>
							<Table.Td c="bright">{details.name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td py="sm">Instance Type</Table.Td>
							<Table.Td c="bright">{instanceType?.display_name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td py="sm">Compute nodes</Table.Td>
							<Table.Td c="bright">
								{details.units} Node{details.units === 1 ? "" : "s"}
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td py="sm">Region</Table.Td>
							<Table.Td c="bright">{details.region}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td pt="sm">Version</Table.Td>
							<Table.Td c="bright">SurrealDB {details.version}</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
			</Paper>

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
				onPrevious={handlePrevious}
				onContinue={onContinue}
			/>
		</Stack>
	);
}
