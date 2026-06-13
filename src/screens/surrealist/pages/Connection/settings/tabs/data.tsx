import { Alert, Badge, Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon, iconDatabase, iconDownload, iconInfo, iconUpload } from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openRequiredDatabaseModal } from "~/modals/require-database";
import { useDatabaseStore } from "~/stores/database";
import { dispatchIntent } from "~/util/intents";
import { ImportExportCard } from "../sections/capabilities-import-export";
import { DatasetBrowser } from "../sections/dataset-browser";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionDataTab(_props: ConnectionSettingsTabProps) {
	const connected = useIsConnected();
	const [namespace, database] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
	]);

	const schema = useDatabaseSchema();
	const isSyncingSchema = useDatabaseStore((s) => s.isSyncingSchema);
	const hasExistingData =
		!isSyncingSchema &&
		(schema.tables.length > 0 ||
			schema.functions.length > 0 ||
			schema.params.length > 0 ||
			schema.users.length > 0);

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
				<PrimaryTitle fz={32}>Data</PrimaryTitle>
				<Text>Connect to manage data, datasets, and imports.</Text>
			</Stack>
		);
	}

	return (
		<Stack>
			<Group justify="space-between">
				<Group>
					<PrimaryTitle fz={32}>Data</PrimaryTitle>
					{namespace && database ? (
						<Badge
							variant="light"
							color="violet"
						>
							{namespace} / {database}
						</Badge>
					) : null}
				</Group>
				<Button
					size="xs"
					variant="light"
					color="obsidian"
					leftSection={<Icon path={iconDatabase} />}
					onClick={openDatabaseSelector}
				>
					{namespace && database ? "Switch databases" : "Select namespace & database"}
				</Button>
			</Group>

			{namespace && database ? (
				<>
					<Section
						title="Import & export data"
						description="Save or restore data from a surql file into the selected database"
					>
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
					</Section>

					<Section
						title="Official datasets"
						description="Browse official SurrealDB datasets and sample queries for your selected database"
					>
						<DatasetBrowser disabled={hasExistingData} />
					</Section>
				</>
			) : (
				<Alert
					icon={<Icon path={iconInfo} />}
					color="violet"
					variant="light"
					title="No namespace or database selected"
				>
					<Stack>
						You currently have no database selected. Select a database to manage data.
						<Group>
							<Button
								variant="light"
								color="obsidian"
								leftSection={<Icon path={iconDatabase} />}
								onClick={openDatabaseSelector}
							>
								Select namespace & database
							</Button>
						</Group>
					</Stack>
				</Alert>
			)}
		</Stack>
	);
}
