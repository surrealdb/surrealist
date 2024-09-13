import { Autocomplete, Button, Divider, Modal, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import papaparse from "papaparse";
import { sleep } from "radash";
import { useRef, useState } from "react";
import { RecordId, Table } from "surrealdb";
import { adapter } from "~/adapter";
import type { OpenedTextFile } from "~/adapter/base";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SURQL_FILTER } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useIntent } from "~/hooks/url";
import { executeQuery } from "~/screens/database/connection/connection";
import { showError, showInfo } from "~/util/helpers";
import { iconChevronRight, iconDownload } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { parseValue } from "~/util/surrealql";

type Importer = null | "sql" | "csv";

export function Importer() {
	const isLight = useIsLight();
	const tables = useTableNames();
	const isOnline = useIsConnected();
	const [importer, setImporter] = useState<Importer>(null);
	const [isImporting, setImporting] = useState(false);
	const [table, setTable] = useInputState("");

	const importFile = useRef<OpenedTextFile | null>(null);

	const closeImporter = useStable(() => {
		setImporter(null);
	});

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

			if (file.name.endsWith(".csv")) {
				setImporter("csv");
				setTable("");
			} else {
				setImporter("sql");
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

			if (importer === "csv") {
				papaparse.parse(content, {
					header: true,
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
							"id" in content
								? new RecordId(table, content.id)
								: new Table(table);

						executeQuery(
							/* surql */ `CREATE $what CONTENT $content`,
							{ what, content },
						);
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
			closeImporter();
		}
	});

	useIntent("import-database", startImport);

	return (
		<>
			<Entry
				leftSection={<Icon path={iconDownload} />}
				rightSection={<Icon path={iconChevronRight} />}
				onClick={startImport}
				loading={isImporting}
				disabled={!isOnline}
				style={{ flexShrink: 0 }}
				bg="transparent"
			>
				Import data
			</Entry>

			<Modal
				opened={importer === "sql"}
				onClose={closeImporter}
				size="sm"
				title={<PrimaryTitle>Import database</PrimaryTitle>}
			>
				<Text mb="xl" c={isLight ? "slate.7" : "slate.2"}>
					Are you sure you want to import the selected file?
				</Text>

				<Text mb="xl" c={isLight ? "slate.7" : "slate.2"}>
					While existing data will be preserved, it may be overwritten
					by the imported data.
				</Text>

				<Button
					mt="xl"
					fullWidth
					onClick={confirmImport}
					loading={isImporting}
					variant="gradient"
				>
					Start import
					<Icon path={iconDownload} right />
				</Button>
			</Modal>

			<Modal
				opened={importer === "csv"}
				onClose={closeImporter}
				size="sm"
				title={<PrimaryTitle>Import table</PrimaryTitle>}
			>
				<Stack>
					<Text>
						This importer allows you to parse CSV data into a table.
					</Text>
					<Text>
						The first row of the CSV file will be interpreted as
						column names. Before importing, make sure these match
						the columns in the table you are importing to.
					</Text>

					<Text>
						While existing data will be preserved, it may be
						overwritten by the imported data.
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

					<Button
						mt="md"
						fullWidth
						onClick={confirmImport}
						loading={isImporting}
						variant="gradient"
						disabled={!table}
					>
						Start import
						<Icon path={iconDownload} right />
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
