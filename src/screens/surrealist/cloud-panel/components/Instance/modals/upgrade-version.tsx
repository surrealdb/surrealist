import { Box, Button, Group, Paper, Select, Text } from "@mantine/core";

import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstance } from "~/types";
import { fetchAPI } from "../../../api";
import { useStable } from "~/hooks/stable";
import { useInputState } from "@mantine/hooks";

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

	const [version, setVersion] = useInputState("");

	const { mutateAsync, isPending } = useMutation({
		mutationFn: (version: string) =>
			fetchAPI(`/instances/${instance.id}/version`, {
				method: "PATCH",
				body: JSON.stringify({
					version,
				}),
			}),
	});

	const requestUpdate = useStable(() => {
		mutateAsync(version).then(() => {
			closeAllModals();
		});
	});

	return (
		<Stack>
			<Paper
				bg={isLight ? "slate.0" : "slate.9"}
				p="xl"
			>
				<Stack gap="xl">
					<Text>Select which version of SurrealDB you want this instance to run</Text>

					<Select
						data={instance.available_versions}
						placeholder={instance.version}
						value={version}
						onChange={setVersion}
					/>
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
					disabled={!version}
					onClick={requestUpdate}
					loading={isPending}
					flex={1}
				>
					Update
				</Button>
			</Group>
		</Stack>
	);
}
