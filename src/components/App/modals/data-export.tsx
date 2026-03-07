import {
	Alert,
	Box,
	Button,
	Checkbox,
	Divider,
	Group,
	Loader,
	Modal,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { useSet } from "@mantine/hooks";
import { showNotification, updateNotification } from "@mantine/notifications";
import { Icon, iconCheck, iconDownload, iconWarning } from "@surrealdb/ui";
import dayjs from "dayjs";
import { adapter, isBrowser } from "~/adapter";
import { Option } from "~/components/Option";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SURQL_FILTER } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useMinimumVersion } from "~/hooks/connection";
import { useIntent } from "~/hooks/routing";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import {
	isStreamingSupported,
	requestDatabaseExport,
} from "~/screens/surrealist/connection/connection";
import { tagEvent } from "~/util/analytics";
import { slugify } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";

function toggleSet<T>(set: Set<T>, item: T) {
	if (set.has(item)) {
		set.delete(item);
	} else {
		set.add(item);
	}
}

type ExportFlag =
	| "users"
	| "accesses"
	| "params"
	| "functions"
	| "analyzers"
	| "records"
	| "sequences";

const RESOURCES: ExportFlag[] = [
	"users",
	"accesses",
	"params",
	"functions",
	"analyzers",
	"records",
	"sequences",
];

export function DataExportModal() {
	const tables = useTableNames();
	const name = useConnection((c) => c?.name ?? "");

	const [configSupport] = useMinimumVersion("2.1.0");
	const [isOpen, openedHandle] = useBoolean();

	const exportFlags = useSet<ExportFlag>();
	const exportTables = useSet<string>();

	const fileName = `${slugify(name)}-${dayjs().format("YYYY-MM-DD")}.surql`;

	const handleExport = useStable(async () => {
		openedHandle.close();

		const id = showNotification({
			title: "Exporting database",
			message: "Please wait while the database is exported",
			icon: (
				<Loader
					color="violet"
					size="sm"
				/>
			),
			autoClose: false,
		});

		try {
			const success = await adapter.saveFile(
				"Save database export",
				fileName,
				[SURQL_FILTER],
				async () => {
					return requestDatabaseExport({
						users: exportFlags.has("users"),
						accesses: exportFlags.has("accesses"),
						params: exportFlags.has("params"),
						functions: exportFlags.has("functions"),
						analyzers: exportFlags.has("analyzers"),
						records: exportFlags.has("records"),
						sequences: exportFlags.has("sequences"),
						tables: Array.from(exportTables),
					});
				},
			);

			if (success) {
				updateNotification({
					id,
					message: "Database successfully exported",
					icon: <Icon path={iconCheck} />,
					autoClose: 1000,
					color: "green",
				});

				tagEvent("export", { extension: "surql" });
			} else {
				updateNotification({
					id,
					message: "Export failed",
					icon: <Icon path={iconWarning} />,
					autoClose: 1000,
					color: "red",
				});
			}
		} catch (err: any) {
			console.error(err);
			updateNotification({
				id,
				message: "Export failed",
				icon: <Icon path={iconWarning} />,
				autoClose: 1000,
				color: "red",
			});
		}
	});

	const toggleAllResources = useStable(() => {
		if (exportFlags.size === RESOURCES.length) {
			exportFlags.clear();
		} else {
			RESOURCES.forEach((resource) => exportFlags.add(resource));
		}
	});

	const toggleAllRecords = useStable(() => {
		if (exportTables.size === tables.length) {
			exportTables.clear();
		} else {
			tables.forEach((table) => exportTables.add(table));
		}
	});

	const isEmpty = exportFlags.size === 0 && exportTables.size === 0;
	const streamSupport = isStreamingSupported();

	useIntent("export-database", () => {
		openedHandle.open();
		syncConnectionSchema();
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			size="lg"
			title={<PrimaryTitle>Export database</PrimaryTitle>}
		>
			<Stack gap="xl">
				<Text>
					Select which schema resources and table records you want to include in your
					export.
				</Text>

				{streamSupport === "unsupported-browser" ? (
					<Alert
						icon={<Icon path={iconWarning} />}
						color="orange"
					>
						Your {isBrowser ? "browser" : "environment"} does not support streaming
						exports. For larger exports, please use the SurrealDB CLI.
					</Alert>
				) : streamSupport === "unsupported-engine" ? (
					<Alert
						icon={<Icon path={iconWarning} />}
						color="orange"
					>
						The current connection does not support streaming exports. Performance may
						be degraded.
					</Alert>
				) : null}

				{!configSupport ? (
					<Alert
						icon={<Icon path={iconWarning} />}
						color="orange"
					>
						The remote database does not support export customization
					</Alert>
				) : (
					<>
						<Box>
							<Text
								c="bright"
								fw={600}
								fz="lg"
								mb="xs"
							>
								Resources
							</Text>

							<Checkbox
								pl="sm"
								py="sm"
								label="Select all resources"
								checked={RESOURCES.every((v) => exportFlags.has(v))}
								onChange={toggleAllResources}
								disabled={!configSupport}
								indeterminate={RESOURCES.some(
									(v) =>
										exportFlags.has(v) && exportFlags.size < RESOURCES.length,
								)}
							/>

							<Divider my="xs" />

							<SimpleGrid
								cols={3}
								spacing="xs"
								mt="xs"
							>
								<Option
									label="Record data"
									checked={exportFlags.has("records")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "records")}
								/>
								<Option
									label="Access methods"
									checked={exportFlags.has("accesses")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "accesses")}
								/>
								<Option
									label="Analyzers"
									checked={exportFlags.has("analyzers")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "analyzers")}
								/>
								<Option
									label="Functions"
									checked={exportFlags.has("functions")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "functions")}
								/>
								<Option
									label="Parameters"
									checked={exportFlags.has("params")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "params")}
								/>
								<Option
									label="Users"
									checked={exportFlags.has("users")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "users")}
								/>
								<Option
									label="Sequences"
									checked={exportFlags.has("sequences")}
									disabled={!configSupport}
									onChange={() => toggleSet(exportFlags, "sequences")}
								/>
							</SimpleGrid>
						</Box>

						{tables.length > 0 && (
							<Box>
								<Text
									c="bright"
									fw={600}
									fz="lg"
									mb="xs"
								>
									Tables
								</Text>

								<Group>
									<Checkbox
										pl="sm"
										py="sm"
										label="Select all tables"
										checked={exportTables.size === tables.length}
										onChange={toggleAllRecords}
										disabled={!configSupport}
										indeterminate={
											exportTables.size > 0 &&
											exportTables.size < tables.length
										}
									/>
									<Spacer />
									<Text fz="xs">
										{exportTables.size} of {tables.length} selected
									</Text>
								</Group>

								<Divider my="xs" />

								<ScrollArea.Autosize mah={200}>
									<SimpleGrid
										cols={3}
										spacing="xs"
									>
										{tables.map((table) => (
											<Option
												key={table}
												label={table}
												checked={exportTables.has(table)}
												disabled={!configSupport}
												onChange={() => {
													if (exportTables.has(table)) {
														exportTables.delete(table);
													} else {
														exportTables.add(table);
													}
												}}
											/>
										))}
									</SimpleGrid>
								</ScrollArea.Autosize>
							</Box>
						)}
					</>
				)}

				<Group mt="xs">
					<Button
						flex={1}
						color="obsidian"
						variant="light"
						onClick={openedHandle.close}
					>
						Cancel
					</Button>
					<Button
						flex={1}
						onClick={handleExport}
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
