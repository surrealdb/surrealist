import { Autocomplete, Button, Combobox, Modal } from "@mantine/core";
import { SURQL_FILTER } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useRef, useState } from "react";
import { Icon } from "../../../components/Icon";
import { adapter } from "~/adapter";
import { showError, showInfo } from "~/util/helpers";
import { ModalTitle } from "../../../components/ModalTitle";
import { Text } from "@mantine/core";
import { syncDatabaseSchema } from "~/util/schema";
import { OpenedTextFile } from "~/adapter/base";
import { iconChevronRight, iconDownload } from "~/util/icons";
import { Entry } from "~/components/Entry";
import { useIntent } from "~/hooks/url";
import { executeQuery } from "~/connection";
import { useInputState } from "@mantine/hooks";
import { useTableNames } from "~/hooks/schema";

type Importer = null | 'sql' | 'csv';

export function Importer() {
	const isLight = useIsLight();
	const tables = useTableNames();
	const isOnline = useIsConnected();
	const [importer, setImporter] = useState<Importer>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [table, setTable] = useInputState("");

	const importFile = useRef<OpenedTextFile | null>(null);

	const closeImporter = useStable(() => {
		setImporter(null);
	});

	const startImport = useStable(async () => {
		try {
			const [file] = await adapter.openTextFile(
				'Import query file',
				[SURQL_FILTER, {
					name: "Table data (csv)",
					extensions: ["csv"],
				}],
				false
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
			setIsImporting(false);
		}
	});

	const confirmImport = useStable(async () => {
		try {
			setIsImporting(true);

			await executeQuery(importFile.current!.content);

			showInfo({
				title: "Importer",
				subtitle: "Database was successfully imported"
			});

			await syncDatabaseSchema();
		} catch(err: any) {
			console.error(err);

			showError({
				title: "Import failed",
				subtitle: "There was an error importing the database"
			});
		} finally {
			setIsImporting(false);
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
				opened={importer === 'sql'}
				onClose={closeImporter}
				size="sm"
				title={<ModalTitle>Import database</ModalTitle>}
			>
				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
				>
					Are you sure you want to import the selected file?
				</Text>

				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
				>
					While existing data will be preserved, it may be overwritten by the imported data.
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
				opened={importer === 'csv'}
				onClose={closeImporter}
				size="sm"
				title={<ModalTitle>Import table</ModalTitle>}
			>
				<Autocomplete
					data={tables}
					value={table}
					onChange={setTable}
					label="Table name"
					required
				/>

				<Text
					mb="xl"
					c={isLight ? "slate.7" : "slate.2"}
				>
					While existing data will be preserved, it may be overwritten by the imported data.
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
		</>
	);
}