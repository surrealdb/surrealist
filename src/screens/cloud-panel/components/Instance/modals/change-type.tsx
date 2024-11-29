import { Box, Button, Group, Paper, ScrollArea, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { fetchAPI } from "~/screens/cloud-panel/api";
import { useCloudInstancesQuery } from "~/screens/cloud-panel/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-panel/hooks/limits";
import type { CloudInstance } from "~/types";
import { EstimatedCost } from "../../EstimatedCost";
import { InstanceType } from "../../InstanceType";

export async function openInstanceTypeModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Change instance type</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		children: <InstanceTypeModal instance={instance} />,
	});
}

interface InstanceTypeModalProps {
	instance: CloudInstance;
}

function InstanceTypeModal({ instance }: InstanceTypeModalProps) {
	const instanceTypes = useAvailableInstanceTypes();
	const current = useOrganization();
	const isLight = useIsLight();

	const [selected, setSelected] = useState(instance.type.slug);

	const { data: instances } = useCloudInstancesQuery(current?.id);
	const isAvailable = useCloudTypeLimits(instances ?? []);
	const instanceInfo = instanceTypes.find((type) => type.slug === selected);

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (slug: string) =>
			fetchAPI(`/instances/${instance.id}/type`, {
				method: "PATCH",
				body: JSON.stringify({
					slug,
				}),
			}),
	});

	const requestChange = useStable(() => {
		mutateAsync(selected).then(() => {
			closeAllModals();
		});
	});

	return (
		<Stack>
			<Text mb="lg">
				Instance types define the resources allocated to your cloud instance. Choose a
				configuration that best fits your needs.
			</Text>

			<Paper bg={isLight ? "slate.0" : "slate.9"}>
				<ScrollArea.Autosize mah={350}>
					<Stack p="xl">
						{instanceTypes.map((type) => (
							<InstanceType
								key={type.slug}
								type={type}
								isActive={type.slug === selected}
								isLimited={!isAvailable(type)}
								onSelect={setSelected}
							/>
						))}
					</Stack>
				</ScrollArea.Autosize>
			</Paper>

			{instanceInfo && (
				<EstimatedCost
					type={instanceInfo}
					units={instance.compute_units}
				/>
			)}

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
					disabled={instance.type.slug === selected}
					loading={isPending}
					flex={1}
				>
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}
