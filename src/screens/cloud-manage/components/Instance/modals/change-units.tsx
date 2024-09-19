import { Alert, Box, Button, Group, Paper, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import type { CloudInstance } from "~/types";
import { InstanceType } from "../../InstanceType";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "~/screens/cloud-manage/api";
import { CounterInput } from "~/components/Inputs";

export async function openComputeUnitsModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Change compute nodes</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		children: <ComputeUnitsModal instance={instance} />,
	});
}

interface ComputeUnitsModalProps {
	instance: CloudInstance;
}

function ComputeUnitsModal({ instance }: ComputeUnitsModalProps) {
	const [units, setUnits] = useState(instance.compute_units);

	const minComputeUnits = instance.type.compute_units.min;
	const maxComputeUnits = instance.type.compute_units.max;
	const hasSingleCompute = minComputeUnits === 1 && maxComputeUnits === 1;

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (compute_units: number) =>
			fetchAPI(`/instances/${instance.id}/computeunits`, {
				method: "PATCH",
				body: JSON.stringify({
					compute_units,
				}),
			}),
	});

	const requestChange = useStable(() => {
		mutateAsync(units).then(() => {
			closeAllModals();
		});
	});

	return (
		<Stack>
			<Paper
				bg="slate.9"
				p="xl"
			>
				<Stack>
					<Text mb="lg">
						Select the number of compute nodes you would like to use for your instance. Each
						compute node provides additional processing power to your instance.
					</Text>

					{!hasSingleCompute ? (
						<Alert
							color="blue"
							title="Upgrade to use compute nodes"
						>
							Compute nodes are not customisable for free instances
						</Alert>
					) : (
						<>
							<Text
								fw={600}
								fz="xl"
								c="bright"
							>
								Your selected instance
							</Text>
							<InstanceType
								type={instance.type}
								inactive
							/>
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
					)}
				</Stack>
			</Paper>

			<Group mt="md">
				<Button
					onClick={() => closeAllModals()}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					type="submit"
					variant="gradient"
					onClick={requestChange}
					disabled={instance.compute_units === units}
					loading={isPending}
					flex={1}
				>
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}
