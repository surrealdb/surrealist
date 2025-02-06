import { Autocomplete, Button, Divider, Modal, Stack, Switch, TextInput } from "@mantine/core";
import { Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import papaparse from "papaparse";
import { sleep } from "radash";
import { useMemo, useRef, useState } from "react";
import { RecordId, Table } from "surrealdb";
import { adapter } from "~/adapter";
import type { OpenedTextFile } from "~/adapter/base";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SURQL_FILTER } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useIntent } from "~/hooks/routing";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { showError, showInfo } from "~/util/helpers";
import { iconDownload } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { parseValue } from "~/util/surrealql";

type ImportType = "sql" | "csv";

export function DataImportModal() {
	const isLight = useIsLight();
	const tables = useTableNames();

	const [isOpen, openedHandle] = useBoolean();

	const [importType, setImportType] = useState<ImportType>("sql");
	const [isImporting, setImporting] = useState(false);
	const [table, setTable] = useInputState("");
	const [header, setHeader] = useInputState(true);
	const [delimiter, setDelimiter] = useInputState(papaparse.DefaultDelimiter);

	const importFile = useRef<OpenedTextFile | null>(null);

	const importedRows = useMemo(() => {
		if (importType === "csv" && importFile.current) {
			const content = importFile.current.content.trim();

			return papaparse.parse(content, {
				delimiter,
				header,
				dynamicTyping: true,
				transform(value) {
					try {
						return parseValue(value);
					} catch {
						return value;
					}
				},
			}).data;
		}

		return null;
	}, [importType, delimiter, header]);

	const startImport = useStable(async () => {
		try {
			const [file] = await adapter.openTextFile(
				"Import query file",
				[
					SURQL_FILTER,
					{
						name: "Table data (csv)",
						extensions: ["csv"],
					},
				],
				false,
			);

			if (!file) {
				return;
			}

			importFile.current = file;
			openedHandle.open();

			if (file.name.endsWith(".csv")) {
				const possibleTableName = file.name.replace(".csv", "");
				const isValidTableName = !!possibleTableName.match(/^[a-zA-Z][a-zA-Z0-9_]*$/);

				setImportType("csv");
				setTable(isValidTableName ? possibleTableName : "");
			} else {
				setImportType("sql");
			}
		} finally {
			setImporting(false);
		}
	});

	const confirmImport = useStable(async () => {
		if (!importFile.current) return;

		try {
			setImporting(true);

			await sleep(50);

			const content = importFile.current.content.trim();

			if (importType === "csv") {
				papaparse.parse(content, {
					delimiter,
					header,
					dynamicTyping: true,
					transform(value) {
						try {
							return parseValue(value);
						} catch {
							return value;
						}
					},
					step(row, parser) {
						if (row.errors.length > 0) {
							const err = row.errors[0].message;

							showError({
								title: "Import failed",
								subtitle: `There was an error importing the CSV file: ${err}`,
							});

							parser.abort();
							return;
						}

						const content = row.data as any;
						const what =
							"id" in content ? new RecordId(table, content.id) : new Table(table);

						executeQuery(/* surql */ `CREATE $what CONTENT $content`, {
							what,
							content,
						});
					},
					complete() {
						syncConnectionSchema();
					},
				});
			} else {
				await executeQuery(content);

				showInfo({
					title: "Importer",
					subtitle: "Database was successfully imported",
				});

				await syncConnectionSchema();
			}
		} catch (err: any) {
			console.error(err);

			showError({
				title: "Import failed",
				subtitle: "There was an error importing the database",
			});
		} finally {
			setImporting(false);
			openedHandle.close();
		}
	});

	useIntent("import-database", startImport);

	return (
		<Modal
			opened={isOpen}
			onClose={openedHandle.close}
			title={
				<PrimaryTitle>Import {importType === "sql" ? "database" : "table"}</PrimaryTitle>
			}
		>
			{importType === "sql" ? (
				<Stack>
					<Text c={isLight ? "slate.7" : "slate.2"}>
						Are you sure you want to import the selected file?
					</Text>

					<Text
						mb="xl"
						c={isLight ? "slate.7" : "slate.2"}
					>
						While existing data will be preserved, it may be overwritten by the imported
						data.
					</Text>

					<Button
						mt="xl"
						fullWidth
						onClick={confirmImport}
						loading={isImporting}
						variant="gradient"
					>
						Start import
						<Icon
							path={iconDownload}
							right
						/>
					</Button>
				</Stack>
			) : (
				<Stack>
					<Text>This importer allows you to parse CSV data into a table.</Text>

					<Text>
						While existing data will be preserved, it may be overwritten by the imported
						data.
					</Text>

					<Divider />

					<Autocomplete
						data={tables}
						value={table}
						onChange={setTable}
						label="Table name"
						size="sm"
						required
						placeholder="table_name"
					/>

					<Divider />

					<Switch
						checked={header}
						onChange={setHeader}
						label="With headers"
						size="sm"
						required
					/>

					<TextInput
						value={delimiter}
						onChange={setDelimiter}
						label="Column delimiter"
						size="sm"
						required
						maxLength={1}
					/>

					<Button
						mt="md"
						fullWidth
						onClick={confirmImport}
						loading={isImporting}
						variant="gradient"
						disabled={!table}
					>
						Start import
						<Icon
							path={iconDownload}
							right
						/>
					</Button>

					{importedRows ? (
						<Text
							fz="sm"
							c="slate"
							mt={-3}
						>
							Importing this file will create or update {importedRows.length} records
							in total.
						</Text>
					) : null}
				</Stack>
			)}
		</Modal>
	);
}
