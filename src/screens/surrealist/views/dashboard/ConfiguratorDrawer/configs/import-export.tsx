import { Box, Button, Divider, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { adapter } from "~/adapter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceCapabilitiesMutation } from "~/cloud/mutations/capabilities";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { JSON_FILTER } from "~/constants";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudInstanceCapabilities } from "~/types";
import { parseCapabilities, transformCapabilities } from "~/util/capabilities";
import { showErrorNotification } from "~/util/helpers";
import { iconDownload, iconUpload } from "~/util/icons";
import classes from "../style.module.scss";

export interface ImportExportProps {
	instance: CloudInstance;
	onClose: () => void;
}

export function ImportExport({ instance, onClose }: ImportExportProps) {
	const { mutateAsync } = useUpdateInstanceCapabilitiesMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const [value, setValue] = useState<CloudInstanceCapabilities | undefined>(undefined);

	const handleUpdate = useStable(() => {
		if (!value) return;

		confirmUpdate(transformCapabilities(value));
		onClose();
	});

	const handleExport = useStable(() => {
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

	const handleImport = useStable(async () => {
		try {
			const files = await adapter.openTextFile(
				"Import capabilities configuration",
				[JSON_FILTER],
				false,
			);

			if (files.length === 0) return;

			const file = files[0].self;

			if (!file) return;

			const text = await file.text();
			const parsed = JSON.parse(text);

			console.log(typeof parsed);

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
		<Stack
			h="100%"
			gap={0}
		>
			<Divider />

			<Box
				pos="relative"
				flex={1}
			>
				<ScrollArea
					pos="absolute"
					inset={0}
					className={classes.scrollArea}
				>
					<Stack
						gap="sm"
						p="xl"
						mih="100%"
					>
						<Box mb="xl">
							<Text
								fz="xl"
								c="bright"
								fw={600}
							>
								Capabilities importer and exporter
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Backup or restore your instance's capabilities configuration from a
								json file. This functionality is useful for duplicating your
								instance's capability settings across multiple instances.
							</Text>
						</Box>
						<Stack>
							<Paper
								variant="interactive"
								p="md"
								onClick={handleImport}
							>
								<Group justify="space-between">
									<PrimaryTitle fz="lg">Import</PrimaryTitle>
									<Icon path={iconUpload} />
								</Group>
								<Text fz="sm">
									Import a capabilities configuration from a json file
								</Text>
							</Paper>
							<Paper
								variant="interactive"
								p="md"
								onClick={handleExport}
							>
								<Group justify="space-between">
									<PrimaryTitle fz="lg">Export</PrimaryTitle>
									<Icon path={iconDownload} />
								</Group>
								<Text fz="sm">
									Export your instance's capabilities configuration to a json file
								</Text>
							</Paper>
						</Stack>
					</Stack>
				</ScrollArea>
			</Box>

			<Group p="xl">
				<Button
					onClick={onClose}
					color="slate"
					variant="light"
					flex={1}
				>
					Close
				</Button>
				<Button
					flex={1}
					type="submit"
					variant="gradient"
					disabled={!value}
					onClick={handleUpdate}
				>
					Apply capabilities
				</Button>
			</Group>
		</Stack>
	);
}
