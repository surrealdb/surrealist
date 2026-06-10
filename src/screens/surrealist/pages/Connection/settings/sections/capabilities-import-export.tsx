import { Box, Button, Group, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon, iconDownload, iconUpload } from "@surrealdb/ui";
import { useState } from "react";
import { adapter } from "~/adapter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceCapabilitiesMutation } from "~/cloud/mutations/capabilities";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { JSON_FILTER } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstance, CloudInstanceCapabilities } from "~/types";
import { parseCapabilities, transformCapabilities } from "~/util/capabilities";
import { showErrorNotification } from "~/util/helpers";

export interface CapabilitiesImportExportProps {
	instance: CloudInstance;
}

export interface ImportExportCardProps {
	title: string;
	description: string;
	icon: string;
	onClick: () => void;
}

export function ImportExportCard({ title, description, icon, onClick }: ImportExportCardProps) {
	const isLight = useIsLight();

	return (
		<Paper
			p="md"
			bg={isLight ? "obsidian.0" : "obsidian.7"}
			onClick={onClick}
			style={{ cursor: "pointer" }}
		>
			<Group justify="space-between">
				<PrimaryTitle fz="lg">{title}</PrimaryTitle>
				<Icon path={icon} />
			</Group>
			<Text fz="sm">{description}</Text>
		</Paper>
	);
}

export function CapabilitiesImportExport({ instance }: CapabilitiesImportExportProps) {
	const { mutateAsync } = useUpdateInstanceCapabilitiesMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const [value, setValue] = useState<CloudInstanceCapabilities | undefined>(undefined);

	const handleApply = useStable(() => {
		if (!value) return;

		confirmUpdate(transformCapabilities(value));
		setValue(undefined);
	});

	const handleCapabilitiesExport = useStable(() => {
		const capabilities = instance.capabilities;

		adapter.saveFile(
			"Save capabilities configuration",
			instance.name.replaceAll(" ", "-").toLowerCase().concat("-capabilities.json"),
			[JSON_FILTER],
			async () => {
				return JSON.stringify(capabilities);
			},
		);
	});

	const handleCapabilitiesImport = useStable(async () => {
		try {
			const [file] = await adapter.openFile(
				"Import capabilities configuration",
				[JSON_FILTER],
				false,
			);

			if (!file) return;

			if (!file.name.toLowerCase().endsWith(".json")) {
				showErrorNotification({
					title: "Import failed",
					content: "Capabilities configuration must be a JSON file",
				});
				return;
			}

			const text = await file.text();
			const parsed = JSON.parse(text);

			if (typeof parsed !== "object") {
				showErrorNotification({
					title: "Import failed",
					content: "Invalid capabilities configuration file provided",
				});
				return;
			}

			setValue(parseCapabilities(parsed));
		} catch (error: any) {
			showErrorNotification({
				title: "Failed to import capabilities configuration",
				content: error,
			});
		}
	});

	return (
		<Stack gap="md">
			<SimpleGrid cols={{ base: 1, sm: 2 }}>
				<ImportExportCard
					title="Import"
					description="Import a capabilities configuration from a json file"
					icon={iconUpload}
					onClick={handleCapabilitiesImport}
				/>
				<ImportExportCard
					title="Export"
					description="Export your instance's capabilities configuration to a json file"
					icon={iconDownload}
					onClick={handleCapabilitiesExport}
				/>
			</SimpleGrid>

			{value && (
				<Box>
					<Text
						mb="sm"
						fz="sm"
					>
						Capabilities configuration loaded from file. Apply to update this instance.
					</Text>
					<Group>
						<Button
							variant="light"
							color="obsidian"
							onClick={() => setValue(undefined)}
						>
							Discard
						</Button>
						<Button
							variant="gradient"
							onClick={handleApply}
						>
							Apply capabilities
						</Button>
					</Group>
				</Box>
			)}
		</Stack>
	);
}
