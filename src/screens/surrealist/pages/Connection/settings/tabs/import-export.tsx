import { Paper, Stack, Text } from "@mantine/core";
import { DatabaseExportPanel } from "~/components/App/modals/data-export";
import { DatabaseImportPanel } from "~/components/App/modals/data-import";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useSearchParams } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { openRequiredDatabaseModal } from "~/modals/require-database";
import { CapabilitiesImportExport } from "../sections/capabilities-import-export";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionImportExportTab({ instanceQuery }: ConnectionSettingsTabProps) {
	const connected = useIsConnected();
	const params = useSearchParams();
	const [namespace, database, isCloud] = useConnection((c) => [
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication.mode === "cloud",
	]);

	const instance = instanceQuery.data;
	const exportV3 = params.v3 === "true";
	const selectAllTables = params.tables === "*";
	const selectAllResources = params.resources === "*";

	const requireDatabase = useStable(() => openRequiredDatabaseModal(() => {}));

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

			<Section
				title="Import database"
				description="Import a SurrealQL file or structured data into the selected database"
			>
				<Paper p="md">
					{namespace && database ? (
						<DatabaseImportPanel />
					) : (
						<Text
							fz="sm"
							onClick={requireDatabase}
							style={{ cursor: "pointer" }}
						>
							Select a namespace and database to import data.
						</Text>
					)}
				</Paper>
			</Section>

			<Section
				title="Export database"
				description={
					namespace && database
						? `Export contents from ${namespace}/${database} to a SurrealQL file`
						: "Select a namespace and database to export data"
				}
			>
				<Paper p="md">
					{namespace && database ? (
						<DatabaseExportPanel
							exportV3={exportV3}
							selectAllTables={selectAllTables}
							selectAllResources={selectAllResources}
						/>
					) : (
						<Text
							fz="sm"
							onClick={requireDatabase}
							style={{ cursor: "pointer" }}
						>
							Select a namespace and database to export data.
						</Text>
					)}
				</Paper>
			</Section>

			{isCloud && instance && (
				<Section
					title="Capabilities configuration"
					description="Import or export your cloud instance capabilities as JSON"
				>
					<Paper p="md">
						<CapabilitiesImportExport instance={instance} />
					</Paper>
				</Section>
			)}
		</Stack>
	);
}
