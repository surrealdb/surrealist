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
import papaparse, { LocalFile } from "papaparse";
import { cluster, isArray, isObject, sleep, unique } from "radash";
import { ChangeEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { Duration, RecordId, StringRecordId, SurrealDbError, Table, Uuid } from "surrealdb";
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
import { tagEvent } from "~/util/analytics";
import { showError, showErrorWithInfo, showInfo, showWarning } from "~/util/helpers";
import { iconDownload } from "~/util/icons";
import { syncConnectionSchema } from "~/util/schema";
import { parseValue } from "~/util/surrealql";

type DataFileFormat = "csv" | "json" | "ndjson";
type ImportType = "sql" | DataFileFormat;

type ExecuteTransformAndImportFn = (content: string) => Promise<void>;

type SqlImportFormProps = {
	isImporting: boolean;
	confirmImport: (fn: ExecuteTransformAndImportFn) => void;
};

const SqlImportForm = ({ isImporting, confirmImport }: SqlImportFormProps) => {
	const isLight = useIsLight();

	const submit = () => {
		const execute = async (content: string) => {
			const result = await executeQuery(content);
			const failed = result.filter((result) => !result.success);

			if (failed.length > 0) {
				for (const fail of failed) {
					showErrorWithInfo({
						title: "Import failed",
						message: fail.result,
					});
				}
				return;
			}

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

const extractColumnNames = (importedRows: any[], withHeader: boolean) => {
	return withHeader
		? Object.keys(importedRows?.[0] ?? {})
		: Array(((importedRows?.[0] as unknown[]) ?? []).length).fill("");
};

const extractColumnType = (importedRows: any[], index: number, withHeader: boolean) => {
	const values = withHeader
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
};

const extractColumnTypes = (importedRows: any[], withHeader: boolean) => {
	const length = withHeader
		? Object.keys(importedRows?.[0] ?? {}).length
		: ((importedRows?.[0] as unknown[]) ?? []).length;

	return Array(length)
		.fill("")
		.map((_, index) => extractColumnType(importedRows, index, withHeader));
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

const createEntityId = (value: any, type: SurrealKind, table: string) => {
	if (type === "record") {
		return convertValueToType(value, type);
	}

	return new RecordId(table, convertValueToType(value, type));
};

const createEntity = (data: any, table: string, columnNames: string[], columnTypes: string[]) => {
	const o: any = {};

	for (const key of Object.keys(data)) {
		const value = data[key];
		const type = columnTypes[columnNames.indexOf(key)] as SurrealKind;

		if (key === "id") {
			o[key] = createEntityId(value, type, table);
		} else {
			o[key] = convertValueToType(value, type);
		}
	}

	return o;
};

const applySingleBatchImport = async (items: any[], table: string, insertRelation: boolean) => {
	const queryAction = insertRelation ? "INSERT RELATION" : "INSERT";

	let successImportCount = 0;
	let errorImportCount = 0;
	let errorMessage = undefined;

	const [response] = await executeQuery(/* surql */ `${queryAction} INTO $table $content`, {
		table: new Table(table),
		content: items,
	});

	if (response.success) {
		successImportCount += items.length;
	} else {
		errorImportCount += items.length;
		errorMessage = response.result;
	}

	return { success: response.success, successImportCount, errorImportCount, errorMessage };
};

const applyBatchImport = async (items: any[], table: string, insertRelation: boolean) => {
	const BATCH_CHUNK_SIZE = 1000;

	let successImportCount = 0;
	let errorImportCount = 0;
	let errorMessage = undefined;

	for (const batchedItems of cluster(items, BATCH_CHUNK_SIZE)) {
		const batchedResponse = await applySingleBatchImport(batchedItems, table, insertRelation);

		if (batchedResponse.success) {
			successImportCount += batchedResponse.successImportCount;
		} else {
			errorImportCount += batchedResponse.errorImportCount;
			errorMessage = batchedResponse.errorMessage;
			break;
		}
	}

	return { successImportCount, errorImportCount, errorMessage };
};

const completeBatchImport = async (
	successImportCount: number,
	errorImportCount: number,
	errorMessage: string | undefined,
) => {
	if (errorImportCount > 0) {
		if (successImportCount > 0) {
			showWarning({
				title: "Import partially failed",
				subtitle: `Failed to insert ${errorImportCount} records but ${successImportCount} records were successfully inserted. Error: ${errorMessage}`,
			});
		} else {
			showError({
				title: "Import failed",
				subtitle: `Failed to insert ${errorImportCount} records. Error: ${errorMessage}`,
			});
		}
	} else {
		showInfo({
			title: "Import successful",
			subtitle: `${successImportCount} records were successfully inserted`,
		});
	}

	await syncConnectionSchema();
};

type DataFileImportFormProps = {
	fileFormat: DataFileFormat;
	defaultTableName: string;
	isImporting: boolean;
	importFile: MutableRefObject<OpenedTextFile | null>;
	confirmImport: (fn: ExecuteTransformAndImportFn) => void;
};

const FileFormatFormHeader = ({ fileFormat }: Pick<DataFileImportFormProps, "fileFormat">) => {
	return (
		<>
			<Text>
				This importer allows you to parse {fileFormat.toUpperCase()} data into a table.
			</Text>

			<Text>
				While existing data will be preserved, it may be overwritten by the imported data.
			</Text>
		</>
	);
};

type TableAutocompleteProps = {
	value: string;
	onChange: (value: string) => void;
};

const TableAutocomplete = ({ value, onChange }: TableAutocompleteProps) => {
	const tables = useTableNames();

	return (
		<Autocomplete
			data={tables}
			value={value}
			onChange={onChange}
			label="Table name"
			size="sm"
			required
			placeholder="table_name"
		/>
	);
};

type EditColumnsFormProps = {
	columnNames: string[];
	columnTypes: string[];
	nameChangeDisabled?: boolean;
	onColumnNameChange: (e: ChangeEvent<HTMLInputElement>, index: number) => void;
	onColumnTypeChange: (type: string, index: number) => void;
};

const EditColumnsForm = (props: EditColumnsFormProps) => {
	const { columnNames, columnTypes, nameChangeDisabled, onColumnNameChange, onColumnTypeChange } =
		props;

	return (
		<>
			<Label>Columns</Label>

			<Stack>
				{columnNames.map((c, index) => {
					const type = columnTypes[index];

					return (
						<Group key={index}>
							<TextInput
								value={c}
								onChange={(e) => onColumnNameChange(e, index)}
								disabled={nameChangeDisabled}
								leftSection={<Text>{index + 1}</Text>}
								placeholder="name"
							/>
							<FieldKindInputCore
								value={type}
								onChange={(t) => onColumnTypeChange(t, index)}
								data={SURREAL_KINDS}
								placeholder="type"
							/>
						</Group>
					);
				})}
			</Stack>
		</>
	);
};

type FileFormatFormFooterProps = {
	insertRelation: boolean;
	setInsertRelation: (value: boolean | ChangeEvent<any> | null | undefined) => void;
	canInsertRelation: boolean;
	errorMessage: string | null;
	isImporting: boolean;
	importedRows: any[];
	canExport: boolean;
	submit: () => void;
};

const FileFormatFormFooter = (props: FileFormatFormFooterProps) => {
	const {
		insertRelation,
		setInsertRelation,
		canInsertRelation,
		errorMessage,
		isImporting,
		importedRows,
		canExport,
		submit,
	} = props;

	return (
		<>
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
					{Math.min(importedRows.length, 1_000)}
					{importedRows.length >= 1_000 ? "+" : ""} records in total.
				</Text>
			) : null}
		</>
	);
};

type UseFileFormatFormProps = {
	defaultTableName: string;
	importedRows: any[];
	withHeader?: boolean;
};

const useFileFormatForm = (props: UseFileFormatFormProps) => {
	const { defaultTableName, importedRows, withHeader } = props;

	const [table, setTable] = useInputState(defaultTableName);
	const [insertRelation, setInsertRelation] = useInputState(false);

	const [columnNames, setColumnNames] = useState<string[]>(
		extractColumnNames(importedRows, withHeader ?? true),
	);
	const [columnTypes, setColumnTypes] = useState<string[]>(
		extractColumnTypes(importedRows, withHeader ?? true),
	);

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

	const canExport = useMemo(() => {
		return (
			!!table &&
			columnNames.length > 0 &&
			columnNames.every((c) => !!c) &&
			unique(columnNames).length === columnNames.length &&
			columnTypes.every(isValidColumnType)
		);
	}, [table, columnNames, columnTypes]);

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

	return {
		table,
		setTable,
		columnNames,
		handleColumnNameChange,
		setColumnNames,
		columnTypes,
		handleColumnTypeChange,
		setColumnTypes,
		insertRelation,
		setInsertRelation,
		canInsertRelation,
		canExport,
	};
};

type CsvImportFormProps = DataFileImportFormProps;

const CsvImportForm = ({
	fileFormat,
	defaultTableName,
	isImporting,
	importFile,
	confirmImport,
}: CsvImportFormProps) => {
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
				preview: 1_000,
			});
		}

		return { data: [], errors: [] } as Omit<papaparse.ParseResult<unknown>, "meta">;
	}, [importFile.current, delimiter, header]);

	const {
		table,
		setTable,
		columnNames,
		handleColumnNameChange,
		setColumnNames,
		columnTypes,
		handleColumnTypeChange,
		setColumnTypes,
		insertRelation,
		setInsertRelation,
		canInsertRelation,
		canExport,
	} = useFileFormatForm({
		defaultTableName,
		importedRows,
		withHeader: header,
	});

	const submit = () => {
		const createEntityWithoutHeader = (data: unknown[]) => {
			const o: any = {};

			for (let i = 0; i < data.length; i++) {
				const key = columnNames[i];
				const value = data[i];
				const type = columnTypes[i] as SurrealKind;

				if (key === "id") {
					o[key] = createEntityId(value, type, table);
				} else {
					o[key] = convertValueToType(value, type);
				}
			}

			return o;
		};

		const execute = async (content: string) => {
			if (!importFile.current?.self) {
				const items: any[] = [];

				let isParserSuccess = true;

				papaparse.parse(content, {
					delimiter,
					header,
					skipEmptyLines: true,
					step: async (row, parser) => {
						if (row.errors.length > 0) {
							const err = row.errors[0].message;

							showErrorWithInfo({
								title: "Import failed",
								message: `There was an error importing the CSV file: ${err}`,
							});

							isParserSuccess = false;
							parser.abort();
							return;
						}

						const content = header
							? createEntity(row.data as any, table, columnNames, columnTypes)
							: createEntityWithoutHeader(row.data as unknown[]);

						items.push(content);
					},
				});

				if (!isParserSuccess) {
					return;
				}

				const { errorImportCount, successImportCount, errorMessage } =
					await applyBatchImport(items, table, insertRelation);
				await completeBatchImport(successImportCount, errorImportCount, errorMessage);
			} else {
				let successImportCount = 0;
				let errorImportCount = 0;
				let errorMessage: string | undefined = undefined;

				await new Promise((resolve, reject) => {
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					papaparse.parse(importFile.current!.self as LocalFile, {
						delimiter,
						header,
						skipEmptyLines: true,
						chunkSize: 100 * 1_024,
						chunk: async (results, parser) => {
							if (results.errors.length > 0) {
								const err = results.errors[0];

								showErrorWithInfo({
									title: "Import failed",
									message: `There was an error importing the CSV file: ${err.message}`,
								});

								parser.abort();
								reject();
							}

							const items = results.data.map((row) => {
								return header
									? createEntity(row as any, table, columnNames, columnTypes)
									: createEntityWithoutHeader(row as unknown[]);
							});

							parser.pause();

							const batchedResponse = await applySingleBatchImport(
								items,
								table,
								insertRelation,
							);

							successImportCount += batchedResponse.successImportCount;
							errorImportCount += batchedResponse.errorImportCount;
							if (!errorMessage) {
								errorMessage = batchedResponse.errorMessage;
							}

							parser.resume();
						},
						complete: () => {
							resolve("completed");
						},
					});
				});
				await completeBatchImport(successImportCount, errorImportCount, errorMessage);
			}
		};

		confirmImport(execute);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setColumnNames(extractColumnNames(importedRows, header));
		setColumnTypes(extractColumnTypes(importedRows, header));
	}, [delimiter, header]);

	const errorMessage = errors.length > 0 ? errors[0].message : null;

	return (
		<Stack>
			<FileFormatFormHeader fileFormat={fileFormat} />

			<Divider />

			<TableAutocomplete
				value={table}
				onChange={setTable}
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

			<EditColumnsForm
				columnNames={columnNames}
				columnTypes={columnTypes}
				nameChangeDisabled={header}
				onColumnNameChange={handleColumnNameChange}
				onColumnTypeChange={handleColumnTypeChange}
			/>

			<Divider />

			<FileFormatFormFooter
				insertRelation={insertRelation}
				setInsertRelation={setInsertRelation}
				canInsertRelation={canInsertRelation}
				errorMessage={errorMessage}
				isImporting={isImporting}
				importedRows={importedRows}
				canExport={canExport}
				submit={submit}
			/>
		</Stack>
	);
};

type JsonImportFormProps = DataFileImportFormProps;

const JsonImportForm = ({
	fileFormat,
	defaultTableName,
	isImporting,
	importFile,
	confirmImport,
}: JsonImportFormProps) => {
	const { data: importedRows, errors } = useMemo(() => {
		if (importFile.current) {
			const content = importFile.current.content.trim();

			try {
				const value = JSON.parse(content);
				const items = isArray(value) ? value : [value];

				return { data: items, errors: [] } as { data: any[]; errors: Error[] };
			} catch (err) {
				return { data: [], errors: [err] } as { data: any[]; errors: Error[] };
			}
		}

		return { data: [], errors: [] } as { data: any[]; errors: Error[] };
	}, [importFile.current]);

	const {
		table,
		setTable,
		columnNames,
		handleColumnNameChange,
		columnTypes,
		handleColumnTypeChange,
		insertRelation,
		setInsertRelation,
		canInsertRelation,
		canExport,
	} = useFileFormatForm({
		defaultTableName,
		importedRows,
	});

	const submit = () => {
		const execute = async (content: string) => {
			const value = JSON.parse(content);
			const items = (isArray(value) ? value : [value]).map((data) =>
				createEntity(data, table, columnNames, columnTypes),
			);

			const { errorImportCount, successImportCount, errorMessage } = await applyBatchImport(
				items,
				table,
				insertRelation,
			);
			await completeBatchImport(successImportCount, errorImportCount, errorMessage);
		};

		confirmImport(execute);
	};

	const errorMessage = errors.length > 0 ? errors[0].message : null;

	return (
		<Stack>
			<FileFormatFormHeader fileFormat={fileFormat} />

			<Divider />

			<TableAutocomplete
				value={table}
				onChange={setTable}
			/>

			<Divider />

			<EditColumnsForm
				columnNames={columnNames}
				columnTypes={columnTypes}
				onColumnNameChange={handleColumnNameChange}
				onColumnTypeChange={handleColumnTypeChange}
			/>

			<Divider />

			<FileFormatFormFooter
				insertRelation={insertRelation}
				setInsertRelation={setInsertRelation}
				canInsertRelation={canInsertRelation}
				errorMessage={errorMessage}
				isImporting={isImporting}
				importedRows={importedRows}
				canExport={canExport}
				submit={submit}
			/>
		</Stack>
	);
};

type NdJsonImportFormProps = DataFileImportFormProps;

const NdJsonImportForm = ({
	fileFormat,
	defaultTableName,
	isImporting,
	importFile,
	confirmImport,
}: NdJsonImportFormProps) => {
	const extractItems = useStable((content: string) => {
		const newlineRegex = /\r?\n/;

		return content
			.split(newlineRegex)
			.map((s) => s.trim())
			.map((s) => JSON.parse(s));
	});

	const { data: importedRows, errors } = useMemo(() => {
		if (importFile.current) {
			const content = importFile.current.content.trim();

			try {
				const items = extractItems(content);

				for (const item of items) {
					if (!isObject(item)) {
						throw new Error("Invalid JSON object");
					}
				}

				return { data: items, errors: [] } as { data: any[]; errors: Error[] };
			} catch (err) {
				return { data: [], errors: [err] } as { data: any[]; errors: Error[] };
			}
		}

		return { data: [], errors: [] } as { data: any[]; errors: Error[] };
	}, [importFile.current]);

	const {
		table,
		setTable,
		columnNames,
		handleColumnNameChange,
		columnTypes,
		handleColumnTypeChange,
		insertRelation,
		setInsertRelation,
		canInsertRelation,
		canExport,
	} = useFileFormatForm({
		defaultTableName,
		importedRows,
	});

	const submit = () => {
		const execute = async (content: string) => {
			const items = extractItems(content).map((data) =>
				createEntity(data, table, columnNames, columnTypes),
			);

			const { errorImportCount, successImportCount, errorMessage } = await applyBatchImport(
				items,
				table,
				insertRelation,
			);
			await completeBatchImport(successImportCount, errorImportCount, errorMessage);
		};

		confirmImport(execute);
	};

	const errorMessage = errors.length > 0 ? errors[0].message : null;

	return (
		<Stack>
			<FileFormatFormHeader fileFormat={fileFormat} />

			<Divider />

			<TableAutocomplete
				value={table}
				onChange={setTable}
			/>

			<Divider />

			<EditColumnsForm
				columnNames={columnNames}
				columnTypes={columnTypes}
				onColumnNameChange={handleColumnNameChange}
				onColumnTypeChange={handleColumnTypeChange}
			/>

			<Divider />

			<FileFormatFormFooter
				insertRelation={insertRelation}
				setInsertRelation={setInsertRelation}
				canInsertRelation={canInsertRelation}
				errorMessage={errorMessage}
				isImporting={isImporting}
				importedRows={importedRows}
				canExport={canExport}
				submit={submit}
			/>
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
					{
						name: "JavaScript Object Notation data (json)",
						extensions: ["json"],
					},
					{
						name: "Newline Delimited JSON data (ndjson)",
						extensions: ["ndjson"],
					},
				],
				false,
			);

			if (!file) {
				return;
			}

			importFile.current = file;
			openedHandle.open();

			const configureImportType = (type: ImportType) => {
				setImportType(type);
				tagEvent("import", { extension: type });
			};

			const extractFromFileType = (fileFormat: DataFileFormat) => {
				const possibleTableName = file.name.replace(`.${fileFormat}`, "");
				const possibleTableNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
				const isValidTableName = !!possibleTableName.match(possibleTableNameRegex);

				configureImportType(fileFormat);
				setDefaultTableName(isValidTableName ? possibleTableName : "");
			};

			if (file.name.endsWith(".csv")) {
				extractFromFileType("csv");
			} else if (file.name.endsWith(".json")) {
				extractFromFileType("json");
			} else if (file.name.endsWith(".ndjson")) {
				extractFromFileType("ndjson");
			} else {
				configureImportType("sql");
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
				showErrorWithInfo({
					title: "Import failed",
					message: err.message ?? "An unknown error has occurred",
					cause: err.cause,
					trace: err.stack,
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
					fileFormat={importType}
					defaultTableName={defaultTableName}
					isImporting={isImporting}
					importFile={importFile}
					confirmImport={confirmImport}
				/>
			) : null}
			{importType === "json" ? (
				<JsonImportForm
					fileFormat={importType}
					defaultTableName={defaultTableName}
					isImporting={isImporting}
					importFile={importFile}
					confirmImport={confirmImport}
				/>
			) : null}
			{importType === "ndjson" ? (
				<NdJsonImportForm
					fileFormat={importType}
					defaultTableName={defaultTableName}
					isImporting={isImporting}
					importFile={importFile}
					confirmImport={confirmImport}
				/>
			) : null}
		</Modal>
	);
}
