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
import { isArray, sleep, unique } from "radash";
import { ChangeEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Duration, RecordId, StringRecordId, Table, Uuid } from "surrealdb";
import { adapter } from "~/adapter";
import type { OpenedTextFile } from "~/adapter/base";
import { Icon } from "~/components/Icon";
import { FieldKindInputCore } from "~/components/Inputs";
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

const SURREAL_KINDS = [
	"any",
	"null",
	"bool",
	"bytes",
	"datetime",
	"decimal",
	"duration",
	"float",
	"int",
	"number",
	"object",
	"string",
	"uuid",
	"set",
	"array",
	"record",
] as const;

type SurrealKind = (typeof SURREAL_KINDS)[number];

const extractSurrealType = (value: any): SurrealKind => {
	if (value === undefined || value === null) {
		return "null";
	}
	if (value instanceof Uuid) {
		return "uuid";
	}
	if (value instanceof Duration) {
		return "duration";
	}
	if (value instanceof RecordId) {
		return "record";
	}

	const type = typeof value;
	if (type === "boolean") {
		return "bool";
	}
	if (type === "object" && isArray(value)) {
		return "array";
	}
	return type as "string" | "number" | "object";
};

const isValidColumnType = (type: string) => {
	return (SURREAL_KINDS as readonly string[]).includes(type);
};

const convertValueToType = (value: any, type: SurrealKind): any => {
	if (value === undefined || value === null) {
		return null;
	}

	switch (type) {
		case "any":
			try {
				return parseValue(value);
			} catch {
				return value;
			}
		case "null":
			return null;
		case "bool":
			return !!JSON.parse(value);
		case "bytes":
			return new Uint8Array(convertValueToType(value, "array"));
		case "datetime":
			return new Date(value);
		case "duration":
			return new Duration(value);
		case "float":
		case "decimal":
		case "number":
			return Number(value);
		case "int":
			return Number.parseInt(value, 10);
		case "object":
		case "array":
			return JSON.parse(value);
		case "set":
			return new Set(convertValueToType(value, "array"));
		case "string":
			return value;
		case "uuid":
			return new Uuid(value);
		case "record":
			return new StringRecordId(value);
	}
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
	const [insertRelation, setInsertRelation] = useInputState(false);

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

	const extractColumnType = useStable((index: number) => {
		const values = header
			? importedRows.map((row: any) => {
					const key = Object.keys(importedRows?.[0] ?? {})[index];
					return row?.[key];
				})
			: (importedRows as unknown[][]).map((row) => row[index]);

		const uniqueTypes = unique(values.map(extractSurrealType)).filter((t) => t !== "null");

		if (uniqueTypes.length === 1) {
			return uniqueTypes[0];
		}

		return "string";
	});

	const extractColumnTypes = useStable(() => {
		const length = header
			? Object.keys(importedRows?.[0] ?? {}).length
			: ((importedRows?.[0] as unknown[]) ?? []).length;

		return Array(length)
			.fill("")
			.map((_, index) => extractColumnType(index));
	});

	const [columnNames, setColumnNames] = useState<string[]>(extractColumnNames());
	const [columnTypes, setColumnTypes] = useState<string[]>(extractColumnTypes());

	const submit = () => {
		const createEntityId = (value: any, type: SurrealKind) => {
			if (type === "record") {
				return convertValueToType(value, type);
			}

			return new RecordId(table, convertValueToType(value, type));
		};

		const createEntityWithHeader = (data: any) => {
			const o: any = {};

			for (const key of Object.keys(data)) {
				const value = data[key];
				const type = columnTypes[columnNames.indexOf(key)] as SurrealKind;

				if (key === "id") {
					o[key] = createEntityId(value, type);
				} else {
					o[key] = convertValueToType(value, type);
				}
			}

			return o;
		};

		const createEntityWithoutHeader = (data: unknown[]) => {
			const o: any = {};

			for (let i = 0; i < data.length; i++) {
				const key = columnNames[i];
				const value = data[i];
				const type = columnTypes[i] as SurrealKind;

				if (key === "id") {
					o[key] = createEntityId(value, type);
				} else {
					o[key] = convertValueToType(value, type);
				}
			}

			return o;
		};

		const execute = async (content: string) => {
			papaparse.parse(content, {
				delimiter,
				header,
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
						? createEntityWithHeader(row.data as any)
						: createEntityWithoutHeader(row.data as unknown[]);

					try {
						const queryAction = insertRelation ? "INSERT RELATION" : "INSERT";

						const [response] = await executeQuery(
							/* surql */ `${queryAction} INTO $table $content`,
							{
								table: new Table(table),
								content,
							},
						);

						if (!response.success) {
							showError({
								title: "Import failed",
								subtitle: `There was an error importing the CSV file: ${response.result}`,
							});
							parser.abort();
						}
					} catch (err: any) {
						showError({
							title: "Import failed",
							subtitle: `There was an error importing the CSV file: ${err}`,
						});
						parser.abort();
					}
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
			unique(columnNames).length === columnNames.length &&
			columnTypes.every(isValidColumnType)
		);
	}, [table, columnNames, columnTypes]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setColumnNames(extractColumnNames());
		setColumnTypes(extractColumnTypes());
	}, [delimiter, header]);

	const handleColumnNameChange = useStable((e: ChangeEvent<HTMLInputElement>, index: number) => {
		setColumnNames((prev) => {
			const newColumnNames = [...prev];
			newColumnNames[index] = e.target.value;
			return newColumnNames;
		});
	});

	const handleColumnTypeChange = useStable((type: string, index: number) => {
		setColumnTypes((prev) => {
			const newColumnTypes = [...prev];
			newColumnTypes[index] = type;
			return newColumnTypes;
		});
	});

	const errorMessage = errors.length > 0 ? errors[0].message : null;

	const canInsertRelation = useMemo(() => {
		if (!columnNames.includes("in")) {
			return false;
		}
		if (!columnNames.includes("out")) {
			return false;
		}

		if (columnTypes[columnNames.indexOf("in")] !== "record") {
			return false;
		}
		if (columnTypes[columnNames.indexOf("out")] !== "record") {
			return false;
		}

		return true;
	}, [columnNames, columnTypes]);

	useEffect(() => {
		if (!canInsertRelation) {
			setInsertRelation(false);
		}
	}, [canInsertRelation]);

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
					const type = columnTypes[index];

					return (
						<Group key={index}>
							<TextInput
								value={c}
								onChange={(e) => handleColumnNameChange(e, index)}
								disabled={header}
								leftSection={<Text>{index + 1}</Text>}
								placeholder="name"
							/>
							<FieldKindInputCore
								value={type}
								onChange={(t) => handleColumnTypeChange(t, index)}
								data={SURREAL_KINDS}
								placeholder="type"
							/>
						</Group>
					);
				})}
			</Stack>

			<Divider />

			<Switch
				checked={insertRelation}
				onChange={setInsertRelation}
				disabled={!canInsertRelation}
				label="Insert as a relationship"
				description={`requires "in", "out" to be valid record ids`}
				size="sm"
			/>

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
					Importing this file will create{insertRelation ? "" : " or update"}{" "}
					{importedRows.length} records in total.
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
