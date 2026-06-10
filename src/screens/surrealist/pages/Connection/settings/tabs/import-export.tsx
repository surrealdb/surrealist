import { Button, Paper, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon, iconDatabase, iconDownload, iconUpload } from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openRequiredDatabaseModal } from "~/modals/require-database";
import { dispatchIntent } from "~/util/intents";
import { CapabilitiesImportExport, ImportExportCard } from "../sections/capabilities-import-export";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionImportExportTab({ instanceQuery }: ConnectionSettingsTabProps) {
	const connected = useIsConnected();
	const [namespace, database, isCloud] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication.mode === "cloud",
	]);

	const instance = instanceQuery.data;

	const openDatabaseSelector = useStable(() => openRequiredDatabaseModal(() => {}));

	const handleSchemaImport = useRequireDatabase(() => {
		dispatchIntent("import-database");
	});

	const handleSchemaExport = useRequireDatabase(() => {
		dispatchIntent("export-database");
	});

	if (!connected) {
		return (
			<Stack>
				<PrimaryTitle fz={32}>Import & export</PrimaryTitle>
				<Text>Connect to import or export database contents.</Text>
			</Stack>
		);
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Import & export</PrimaryTitle>

			{isCloud && instance && (
				<Section
					title="Capabilities"
					description="Save or restore your instance's capabilities configuration from a json file"
				>
					<Paper p="md">
						<CapabilitiesImportExport instance={instance} />
					</Paper>
				</Section>
			)}

			<Section
				title={namespace && database ? `Database (${database})` : "Database"}
				description={
					namespace && database
						? `Save or restore data in ${namespace}/${database} from a surql file. Imports and exports only affect the selected namespace and database.`
						: "Select a namespace and database to import or export data"
				}
				rightSection={
					namespace && database ? (
						<Button
							size="xs"
							variant="light"
							color="obsidian"
							leftSection={<Icon path={iconDatabase} />}
							onClick={openDatabaseSelector}
						>
							Switch databases
						</Button>
					) : undefined
				}
			>
				<Paper p="md">
					{namespace && database ? (
						<SimpleGrid cols={{ base: 1, sm: 2 }}>
							<ImportExportCard
								title="Import"
								description="Import data into the selected database from a surql file"
								icon={iconUpload}
								onClick={handleSchemaImport}
							/>
							<ImportExportCard
								title="Export"
								description="Export the selected database to a surql file"
								icon={iconDownload}
								onClick={handleSchemaExport}
							/>
						</SimpleGrid>
					) : (
						<Stack gap="md">
							<Text fz="sm">
								Select a namespace and database to import or export data.
							</Text>
							<Button
								variant="light"
								color="obsidian"
								leftSection={<Icon path={iconDatabase} />}
								onClick={openDatabaseSelector}
							>
								Select namespace & database
							</Button>
						</Stack>
					)}
				</Paper>
			</Section>
		</Stack>
	);
}
