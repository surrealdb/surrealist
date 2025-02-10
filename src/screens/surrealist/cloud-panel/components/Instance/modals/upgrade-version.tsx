import { Box, Button, Group, Paper, Select, Text } from "@mantine/core";

import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstance } from "~/types";

export async function openVersionUpgradeModal(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Box>
				<PrimaryTitle>Update SurrealDB</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		children: <VersionUpgrade instance={instance} />,
	});
}

interface VersionUpgradeProps {
	instance: CloudInstance;
}

function VersionUpgrade({ instance }: VersionUpgradeProps) {
	const isLight = useIsLight();

	return (
		<Stack>
			<Paper
				bg={isLight ? "slate.0" : "slate.9"}
				p="xl"
			>
				<Stack gap="xl">
					<Text>Select which version of SurrealDB you want this instance to run</Text>

					<Select placeholder="SurrealDB 2.0" />
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
