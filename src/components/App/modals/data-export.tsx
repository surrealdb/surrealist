import {
	Alert,
	Button,
	Checkbox,
	Divider,
	Group,
	Modal,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import dayjs from "dayjs";
import { toggle } from "radash";
import { useState } from "react";
import type { SqlExportOptions as BaseExportOptions } from "surrealdb";
import { useImmer } from "use-immer";
import { adapter } from "~/adapter";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SURQL_FILTER } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useMinimumVersion } from "~/hooks/connection";
import { useIntent } from "~/hooks/routing";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { requestDatabaseExport } from "~/screens/surrealist/connection/connection";
import { tagEvent } from "~/util/analytics";
import { showErrorNotification, showInfo, slugify } from "~/util/helpers";
import { iconDownload } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";

export type ExportOptions = BaseExportOptions & { tables: string[] };
export type ExportType = keyof ExportOptions;

const RESOURCES = [
	"accesses",
	"analyzers",
	"functions",
	"params",
	"users",
	"versions",
] satisfies ExportType[];

export function DataExportModal() {
	const tables = useTableNames();
	const name = useConnection((c) => c?.name ?? "");

	const [configSupport] = useMinimumVersion("2.1.0");
	const [isOpen, openedHandle] = useBoolean();

	const [isExporting, setIsExporting] = useState(false);
	const [config, setConfig] = useImmer<ExportOptions>({
		accesses: true,
		analyzers: true,
		functions: true,
		params: true,
		users: true,
		versions: false,
		records: true,
		sequences: true,
		tables: [],
		v3: false,
	});

	const fileName = `${slugify(name)}-${dayjs().format("YYYY-MM-DD")}.surql`;

	const handleExport = useStable(async () => {
		try {
			const success = await adapter.saveFile(
				"Save database export",
				fileName,
				[SURQL_FILTER],
				async () => {
					setIsExporting(true);
					return requestDatabaseExport(config);
				},
			);

			if (success) {
				showInfo({
					title: "Export",
					subtitle: "Database successfully exported",
				});

				tagEvent("export", { extension: "surql" });
			}
		} catch (err: any) {
			showErrorNotification({
				title: "Export failed",
				content: err,
			});
		} finally {
			setIsExporting(false);
			openedHandle.close();
		}
	});

	const toggleAllRecords = useStable(() => {
		if (config.tables.length === tables.length) {
			setConfig((draft) => {
				draft.tables = [];
			});
		} else {
			setConfig((draft) => {
				draft.tables = tables;
			});
		}
	});

	const isEmpty = Object.values(config).every((v) => (Array.isArray(v) ? v.length === 0 : !v));

	useIntent("export-database", () => {
		openedHandle.open();
		syncConnectionSchema();
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			title={<PrimaryTitle>Export database</PrimaryTitle>}
		>
			<Stack gap="xl">
				<Text>
					Select which schema resources and table records you want to include in your
					export.
				</Text>

				{!configSupport ? (
					<Alert
						title="Notice"
						color="orange"
					>
						The remote database does not support export customization
					</Alert>
				) : (
					<>
						<Stack>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								Options
							</Text>

							<SimpleGrid cols={2}>
								<Checkbox
									label="Include table records"
									checked={config.records}
									disabled={!configSupport}
									onChange={() => {
										setConfig((draft) => {
											draft.records = !draft.records;
										});
									}}
								/>
							</SimpleGrid>
						</Stack>

						<Stack>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								Resources
							</Text>

							<SimpleGrid cols={2}>
								{RESOURCES.map((opt) => (
									<Checkbox
										key={opt}
										label={`Include ${opt}`}
										checked={config[opt]}
										disabled={!configSupport}
										onChange={() => {
											setConfig((draft) => {
												draft[opt] = !draft[opt];
											});
										}}
									/>
								))}
							</SimpleGrid>
						</Stack>

						{tables.length > 0 && (
							<Stack>
								<Text
									c="bright"
									fw={600}
									fz="lg"
								>
									Tables
								</Text>
								<Checkbox
									label="Include all tables"
									checked={config.tables.length === tables.length}
									onChange={toggleAllRecords}
									disabled={!configSupport}
									indeterminate={
										config.tables.length > 0 &&
										config.tables.length < tables.length
									}
								/>
								<Divider />
								<Stack gap="sm">
									{tables.map((table) => (
										<Checkbox
											key={table}
											label={table}
											disabled={!configSupport}
											checked={config.tables.includes(table)}
											onChange={() => {
												setConfig((draft) => {
													draft.tables = toggle(draft.tables, table);
												});
											}}
										/>
									))}
								</Stack>
							</Stack>
						)}
					</>
				)}

				<Group>
					<Button
						flex={1}
						color="slate"
						variant="light"
						onClick={openedHandle.close}
					>
						Cancel
					</Button>
					<Button
						flex={1}
						onClick={handleExport}
						loading={isExporting}
						variant="gradient"
						disabled={isEmpty}
						rightSection={<Icon path={iconDownload} />}
					>
						Save export
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
