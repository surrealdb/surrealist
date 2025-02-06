import {
	Autocomplete,
	Button,
	Divider,
	Group,
	Modal,
	Stack,
	Switch,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import papaparse from "papaparse";
import { sleep, unique } from "radash";
import {
	ChangeEvent,
	MutableRefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { RecordId, StringRecordId, Table } from "surrealdb";
import { adapter } from "~/adapter";
import type { OpenedTextFile } from "~/adapter/base";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
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

type ExecuteTransformAndImportFn = (content: string) => Promise<void>;

type SqlImportFormProps = {
	isImporting: boolean;
	confirmImport: (fn: ExecuteTransformAndImportFn) => void;
};

const SqlImportForm = ({ isImporting, confirmImport }: SqlImportFormProps) => {
	const isLight = useIsLight();

	const submit = () => {
		const execute = async (content: string) => {
			await executeQuery(content);

			showInfo({
				title: "Importer",
				subtitle: "Database was successfully imported",
			});

			await syncConnectionSchema();
		};

		confirmImport(execute);
	};

	return (
		<Stack>
			<Text c={isLight ? "slate.7" : "slate.2"}>
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
				onClick={submit}
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
	);
};

type CsvImportFormProps = {
	defaultTableName: string;
	isImporting: boolean;
	importFile: MutableRefObject<OpenedTextFile | null>;
	confirmImport: (fn: ExecuteTransformAndImportFn) => void;
};

const CsvImportForm = ({
	defaultTableName,
	isImporting,
	importFile,
	confirmImport,
}: CsvImportFormProps) => {
	const tables = useTableNames();

	const [table, setTable] = useInputState(defaultTableName);
	const [header, setHeader] = useInputState(true);
	const [delimiter, setDelimiter] = useInputState(papaparse.DefaultDelimiter);

	const { data: importedRows, errors } = useMemo(() => {
		if (importFile.current) {
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
			});
		}

		return { data: [], errors: [] } as Omit<papaparse.ParseResult<unknown>, "meta">;
	}, [importFile.current, delimiter, header]);

	const extractColumnNames = useStable(() => {
		return header
			? Object.keys(importedRows?.[0] ?? {})
			: Array(((importedRows?.[0] as unknown[]) ?? []).length).fill("");
	});

	const [columnNames, setColumnNames] = useState<string[]>(extractColumnNames());

	const submit = () => {
		const createObjectWithoutHeader = (data: unknown[]) => {
			const o: any = {};

			for (let i = 0; i < data.length; i++) {
				o[columnNames[i]] = data[i];
			}

			return o;
		};

		const getWhat = (content: any) => {
			if ("id" in content) {
				if (
					typeof content.id === "string" &&
					(content.id as string).startsWith(`${table}:`)
				) {
					return new StringRecordId(content.id);
				}
				return new RecordId(table, content.id);
			}

			return new Table(table);
		};

		const execute = async (content: string) => {
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
				step: async (row, parser) => {
					if (row.errors.length > 0) {
						const err = row.errors[0].message;

						showError({
							title: "Import failed",
							subtitle: `There was an error importing the CSV file: ${err}`,
						});

						parser.abort();
						return;
					}

					const content = header
						? (row.data as any)
						: createObjectWithoutHeader(row.data as unknown[]);
					const what = getWhat(content);

					await executeQuery(/* surql */ `CREATE $what CONTENT $content`, {
						what,
						content,
					});
				},
				complete: async () => {
					await syncConnectionSchema();
				},
			});
		};

		confirmImport(execute);
	};

	const canExport = useMemo(() => {
		return (
			!!table &&
			columnNames.length > 0 &&
			columnNames.every((c) => !!c) &&
			unique(columnNames).length === columnNames.length
		);
	}, [table, columnNames]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setColumnNames(extractColumnNames());
	}, [delimiter, header]);

	const handleColumnNameChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>, index: number) => {
			setColumnNames((prev) => {
				const newColumnNames = [...prev];
				newColumnNames[index] = e.target.value;
				return newColumnNames;
			});
		},
		[],
	);

	const errorMessage = errors.length > 0 ? errors[0].message : null;

	return (
		<Stack>
			<Text>This importer allows you to parse CSV data into a table.</Text>

			<Text>
				While existing data will be preserved, it may be overwritten by the imported data.
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

			<Group
				justify="space-between"
				grow
			>
				<Stack>
					<Label>With headers</Label>
					<Switch
						checked={header}
						onChange={setHeader}
						aria-label="With headers"
						size="sm"
						required
					/>
				</Stack>

				<TextInput
					value={delimiter}
					onChange={setDelimiter}
					label="Column delimiter"
					size="sm"
					required
					maxLength={1}
				/>
			</Group>

			<Divider />

			<Label>Columns</Label>

			<Stack>
				{columnNames.map((c, index) => {
					return (
						<TextInput
							key={index}
							value={c}
							onChange={(e) => handleColumnNameChange(e, index)}
							disabled={header}
							leftSection={<Text>{index + 1}</Text>}
						/>
					);
				})}
			</Stack>

			{errorMessage ? <Text c="red">Error: {errorMessage}</Text> : null}

			<Button
				mt="md"
				fullWidth
				onClick={submit}
				loading={isImporting}
				variant="gradient"
				disabled={!canExport}
			>
				Start import
				<Icon
					path={iconDownload}
					right
				/>
			</Button>

			{importedRows.length > 0 ? (
				<Text
					fz="sm"
					c="slate"
					mt={-3}
				>
					Importing this file will create or update {importedRows.length} records in
					total.
				</Text>
			) : null}
		</Stack>
	);
};

export function DataImportModal() {
	const [isOpen, openedHandle] = useBoolean();

	const [importType, setImportType] = useState<ImportType>("sql");
	const [isImporting, setImporting] = useState(false);
	const [defaultTableName, setDefaultTableName] = useState("");

	const importFile = useRef<OpenedTextFile | null>(null);

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
				setDefaultTableName(isValidTableName ? possibleTableName : "");
			} else {
				setImportType("sql");
			}
		} finally {
			setImporting(false);
		}
	});

	const confirmImport = useStable(
		async (executeTransformAndImport: ExecuteTransformAndImportFn) => {
			if (!importFile.current) return;

			try {
				setImporting(true);

				await sleep(50);

				const content = importFile.current.content.trim();

				await executeTransformAndImport(content);
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
		},
	);

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
				<SqlImportForm
					isImporting={isImporting}
					confirmImport={confirmImport}
				/>
			) : null}
			{importType === "csv" ? (
				<CsvImportForm
					defaultTableName={defaultTableName}
					isImporting={isImporting}
					importFile={importFile}
					confirmImport={confirmImport}
				/>
			) : null}
		</Modal>
	);
}
