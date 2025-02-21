import { Box, Button, Group, Paper, Select, Text } from "@mantine/core";

import { Stack } from "@mantine/core";
import { closeAllModals, openModal } from "@mantine/modals";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
	const client = useQueryClient();

	const [version, setVersion] = useInputState(instance.available_versions[0] ?? "");

	const { mutateAsync, isPending } = useMutation({
		mutationFn: async (version: string) => {
			await fetchAPI(`/instances/${instance.id}/version`, {
				method: "PATCH",
				body: JSON.stringify({
					version,
				}),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
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
					<Text>
						Update the version of SurrealDB used by this instance to use the latest
						features and improvements.
					</Text>

					<Select
						data={instance.available_versions}
						label="Select a version"
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
					Apply update
				</Button>
			</Group>
		</Stack>
	);
}
