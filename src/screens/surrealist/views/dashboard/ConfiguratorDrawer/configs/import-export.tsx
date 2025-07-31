import { Box, Button, Divider, Group, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { adapter } from "~/adapter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceCapabilitiesMutation } from "~/cloud/mutations/capabilities";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { JSON_FILTER } from "~/constants";
import { useConnection, useRequireDatabase } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudInstanceCapabilities } from "~/types";
import { parseCapabilities, transformCapabilities } from "~/util/capabilities";
import { showErrorNotification } from "~/util/helpers";
import { iconDownload, iconUpload } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import classes from "../style.module.scss";

export interface ImportExportProps {
	instance: CloudInstance;
	onClose: () => void;
}

interface ImportExportCardProps {
	title: string;
	description: string;
	icon: string;
	onClick: () => void;
}

function ImportExportCard({ title, description, icon, onClick }: ImportExportCardProps) {
	return (
		<Paper
			variant="interactive"
			p="md"
			onClick={onClick}
		>
			<Group justify="space-between">
				<PrimaryTitle fz="lg">{title}</PrimaryTitle>
				<Icon path={icon} />
			</Group>
			<Text fz="sm">{description}</Text>
		</Paper>
	);
}

export function ImportExport({ instance, onClose }: ImportExportProps) {
	const { mutateAsync } = useUpdateInstanceCapabilitiesMutation(instance.id);
	const confirmUpdate = useUpdateConfirmation(mutateAsync);

	const [namespace, database] = useConnection((c) => [c?.lastNamespace, c?.lastDatabase]);

	const [value, setValue] = useState<CloudInstanceCapabilities | undefined>(undefined);

	const handleSchemaImport = useRequireDatabase(() => {
		dispatchIntent("import-database");
		onClose();
	});
	const handleSchemaExport = useRequireDatabase(() => {
		dispatchIntent("export-database");
		onClose();
	});

	const handleApply = useStable(() => {
		if (!value) return;

		confirmUpdate(transformCapabilities(value));
		onClose();
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
								Capabilities
							</Text>

							<Text
								mt="sm"
								fz="lg"
							>
								Save or restore your instance's capabilities configuration from a
								json file. This functionality is useful for duplicating your
								instance's capability settings across multiple instances.
							</Text>
						</Box>
						<Stack>
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
						</Stack>
						{namespace && database && (
							<>
								<Box mt={30}>
									<Text
										fz="xl"
										c="bright"
										fw={600}
									>
										Database ({database})
									</Text>

									<Text
										mt="sm"
										fz="lg"
									>
										Save or restore your instance's database from a surql file.
										This only exports or imports data from or to the selected
										namespace and database.
									</Text>
								</Box>
								<Stack>
									<ImportExportCard
										title="Import"
										description="Import the selected database from a surql file"
										icon={iconUpload}
										onClick={handleSchemaImport}
									/>
									<ImportExportCard
										title="Export"
										description="Export the selected database to a surql file"
										icon={iconDownload}
										onClick={handleSchemaExport}
									/>
								</Stack>
							</>
						)}
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
					onClick={handleApply}
				>
					Apply capabilities
				</Button>
			</Group>
		</Stack>
	);
}
