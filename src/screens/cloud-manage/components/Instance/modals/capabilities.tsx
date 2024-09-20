import { Box, Button, Checkbox, Group, Paper, ScrollArea, Text } from "@mantine/core";
import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAvailableInstanceTypes, useOrganization } from "~/hooks/cloud";
import type { CloudInstance } from "~/types";
import { InstanceType } from "../../InstanceType";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useMutation } from "@tanstack/react-query";
import { fetchAPI } from "~/screens/cloud-manage/api";
import { useCloudInstances } from "~/screens/cloud-manage/hooks/instances";
import { useCloudTypeLimits } from "~/screens/cloud-manage/hooks/limits";
import { useIsLight } from "~/hooks/theme";

export async function openCapabilitiesModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Instance capabilities</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		children: <CapabilitiesModal instance={instance} />,
	});
}

interface CapabilitiesModalProps {
	instance: CloudInstance;
}

function CapabilitiesModal({ instance }: CapabilitiesModalProps) {
	const isLight = useIsLight();

	return (
		<Stack>
			<Text mb="lg">Configure the capabilities and restrictions of your cloud instance.</Text>

			<Paper
				bg={isLight ? "slate.0" : "slate.9"}
				p="xl"
			>
				<Stack>
					{/* <Checkbox label="Something" /> */}
					<Text c="slate">No capabilities available for this instance.</Text>
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
					disabled
					flex={1}
				>
					Save changes
				</Button>
			</Group>
		</Stack>
	);
}
