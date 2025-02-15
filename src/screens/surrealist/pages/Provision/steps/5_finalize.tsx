import classes from "../style.module.scss";

import { Divider, Group, Paper, Stack, Table, Tooltip } from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { EstimatedCost } from "~/screens/surrealist/cloud-panel/components/EstimatedCost";
import { formatMemory } from "~/util/helpers";
import { iconHelp } from "~/util/icons";
import { StepActions, StepTitle } from "../actions";
import type { ProvisionStepProps } from "../types";
import { computeStorageSize } from "~/util/cloud";

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
			<StepTitle description="Please confirm the configuration of your new instance" />

			<Paper
				p="lg"
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Table className={classes.table}>
					<Table.Thead>
						<Label>Instance details</Label>
					</Table.Thead>
					<Table.Tbody>
						<Table.Tr>
							<Table.Td w={150}>Name</Table.Td>
							<Table.Td c="bright">{details.name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Version</Table.Td>
							<Table.Td c="bright">SurrealDB {details.version}</Table.Td>
						</Table.Tr>
					</Table.Tbody>
				</Table>
				<Table
					mt="xl"
					className={classes.table}
				>
					<Table.Thead>
						<Label>System configuration</Label>
					</Table.Thead>
					<Table.Tbody>
						<Table.Tr>
							<Table.Td w={150}>Region</Table.Td>
							<Table.Td c="bright">{details.region}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Type</Table.Td>
							<Table.Td c="bright">{instanceType?.display_name}</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>CPU</Table.Td>
							<Table.Td c="bright">{instanceType?.cpu} vCPU</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Memory</Table.Td>
							<Table.Td c="bright">
								{formatMemory(instanceType?.memory ?? 0)}
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>Compute nodes</Table.Td>
							<Table.Td c="bright">
								{details.units} Node{details.units === 1 ? "" : "s"}
							</Table.Td>
						</Table.Tr>
						<Table.Tr>
							<Table.Td>
								<Group gap="xs">
									Storage size
									<Tooltip
										label="Storage is currently limited for the beta. The cap will be removed in a future release."
										w={300}
										style={{ whiteSpace: "unset" }}
									>
										<div>
											<Icon
												path={iconHelp}
												size="sm"
											/>
										</div>
									</Tooltip>
								</Group>
							</Table.Td>
							<Table.Td c="bright">
								{formatMemory(computeStorageSize(instanceType))}
							</Table.Td>
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
