import {
	Alert,
	Box,
	Button,
	Checkbox,
	Group,
	Loader,
	Modal,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState, useSet } from "@mantine/hooks";
import { showNotification, updateNotification } from "@mantine/notifications";
import {
	Icon,
	iconAccount,
	iconAPI,
	iconAuth,
	iconBraces,
	iconCheck,
	iconDollar,
	iconDownload,
	iconFilter,
	iconFunction,
	iconHelp,
	iconModel,
	iconNamespace,
	iconSearch,
	iconWarning,
	iconWrench,
} from "@surrealdb/ui";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { SqlExportOptions } from "surrealdb";
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
import { fuzzyMatch, slugify } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";

function toggleSet<T>(set: Set<T>, item: T) {
	if (set.has(item)) {
		set.delete(item);
	} else {
		set.add(item);
	}
}

type ExportFlag =
	| "records"
	| "functions"
	| "params"
	| "users"
	| "accesses"
	| "analyzers"
	| "apis"
	| "buckets"
	| "modules"
	| "configs"
	| "sequences";

const RESOURCES: ExportFlag[] = [
	"records",
	"functions",
	"params",
	"users",
	"accesses",
	"analyzers",
	"apis",
	"buckets",
	"modules",
	"configs",
	"sequences",
];

const RESOURCE_DETAILS: Record<ExportFlag, { icon: string; label: string }> = {
	records: { icon: iconBraces, label: "Record data" },
	accesses: { icon: iconAuth, label: "Access methods" },
	functions: { icon: iconFunction, label: "Functions" },
	params: { icon: iconDollar, label: "Parameters" },
	users: { icon: iconAccount, label: "Users" },
	analyzers: { icon: iconSearch, label: "Analyzers" },
	apis: { icon: iconAPI, label: "APIs" },
	buckets: { icon: iconNamespace, label: "Buckets" },
	modules: { icon: iconModel, label: "Modules" },
	configs: { icon: iconWrench, label: "Configs" },
	sequences: { icon: iconFilter, label: "Sequences" },
};

export function DataExportModal() {
	const tables = useTableNames();
	const name = useConnection((c) => c?.name ?? "");

	const [configSupport] = useMinimumVersion("2.1.0");
	const [isOpen, openedHandle] = useBoolean();
	const [exportV3, setExportV3] = useState(false);
	const [search, setSearch] = useInputState("");

	const exportFlags = useSet<ExportFlag>();
	const exportTables = useSet<string>();

	const fileName = `${slugify(name)}-${dayjs().format("YYYY-MM-DD")}.surql`;

	const handleExport = useStable(async () => {
		openedHandle.close();

		const messageId = showNotification({
			title: "Exporting database",
			message: "Please wait while the database is exported",
			withCloseButton: false,
			autoClose: false,
			icon: (
				<Loader
					color="violet"
					size="sm"
				/>
			),
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
						apis: exportFlags.has("apis"),
						buckets: exportFlags.has("buckets"),
						modules: exportFlags.has("modules"),
						configs: exportFlags.has("configs"),
						records: exportFlags.has("records"),
						sequences: exportFlags.has("sequences"),
						tables: Array.from(exportTables),
						v3: exportV3,
					} as Partial<SqlExportOptions>);
				},
			);

			if (success) {
				updateNotification({
					id: messageId,
					title: "Exporting database",
					message: "Database successfully exported",
					icon: <Icon path={iconCheck} />,
					autoClose: 2000,
					color: "green",
				});

				if (exportV3) {
					tagEvent("migration_export");
				} else {
					tagEvent("export", { extension: "surql" });
				}
			} else {
				updateNotification({
					id: messageId,
					title: "Export failed",
					message: "The database could not be exported",
					icon: <Icon path={iconWarning} />,
					autoClose: 2000,
					color: "red",
				});
			}
		} catch (err: any) {
			updateNotification({
				id: messageId,
				title: "Export failed",
				message: err.message,
				icon: <Icon path={iconWarning} />,
				autoClose: 2000,
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

	const filteredTables = useMemo(() => {
		if (search.length === 0) {
			return tables;
		}

		return tables.filter((table) => fuzzyMatch(search, table));
	}, [tables, search]);

	const isEmpty = exportFlags.size === 0 && exportTables.size === 0;
	const streamSupport = isStreamingSupported();

	useIntent("export-database", async ({ v3, tables, resources }) => {
		const schema = await syncConnectionSchema();

		if (tables === "*") {
			exportTables.clear();
			schema?.database.tables.forEach((t) => exportTables.add(t.schema.name));
		}

		if (resources === "*") {
			exportFlags.clear();
			RESOURCES.forEach((resource) => exportFlags.add(resource));
		}

		openedHandle.open();
		setExportV3(v3 === "true");
	});

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			size="xl"
			title={<PrimaryTitle>Export database</PrimaryTitle>}
		>
			<Stack gap="xl">
				{exportV3 && (
					<Alert
						icon={<Icon path={iconHelp} />}
						color="blue"
					>
						You are exporting your database for use with SurrealDB 3.0.
					</Alert>
				)}

				<Text>
					Select which schema resources and tables you want to include in your export.
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
							<Group mb="xs">
								<Text
									c="bright"
									fw={600}
									fz="lg"
								>
									Resources
								</Text>
								<Text fz="xs">
									{exportFlags.size} of {RESOURCES.length} selected
								</Text>
								<Spacer />
								<Checkbox
									py="sm"
									label="Select all resources"
									labelPosition="left"
									checked={RESOURCES.every((v) => exportFlags.has(v))}
									onChange={toggleAllResources}
									disabled={!configSupport}
									indeterminate={RESOURCES.some(
										(v) =>
											exportFlags.has(v) &&
											exportFlags.size < RESOURCES.length,
									)}
								/>
							</Group>

							<Paper
								mt="xs"
								withBorder
								bg="none"
								p="sm"
							>
								<SimpleGrid
									cols={3}
									spacing="xs"
								>
									{RESOURCES.map((resource) => {
										const { icon, label } = RESOURCE_DETAILS[resource];

										return (
											<Option
												key={resource}
												label={label}
												checked={exportFlags.has(resource)}
												disabled={!configSupport}
												icon={<Icon path={icon} />}
												onChange={() => toggleSet(exportFlags, resource)}
											/>
										);
									})}
								</SimpleGrid>
							</Paper>
						</Box>

						{tables.length > 0 && (
							<Box>
								<Group mb="xs">
									<Text
										c="bright"
										fw={600}
										fz="lg"
									>
										Tables
									</Text>
									<Text fz="xs">
										{exportTables.size} of {tables.length} selected
									</Text>
									<Spacer />
									<Checkbox
										py="sm"
										label="Select all tables"
										labelPosition="left"
										checked={exportTables.size === tables.length}
										onChange={toggleAllRecords}
										disabled={!configSupport}
										indeterminate={
											exportTables.size > 0 &&
											exportTables.size < tables.length
										}
									/>
								</Group>

								<Paper
									mt="xs"
									withBorder
									bg="none"
								>
									<ScrollArea.Autosize mah={250}>
										<Box
											px="sm"
											pb="sm"
											pt="xs"
										>
											<TextInput
												variant="unstyled"
												value={search}
												onChange={setSearch}
												placeholder="Search tables..."
												leftSection={<Icon path={iconSearch} />}
											/>
											<SimpleGrid
												cols={3}
												spacing="xs"
												mt="xs"
											>
												{filteredTables.length === 0 && (
													<Text
														py="sm"
														pl="sm"
													>
														No tables matched your search
													</Text>
												)}

												{filteredTables.map((table) => (
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
										</Box>
									</ScrollArea.Autosize>
								</Paper>
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
