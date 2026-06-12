import type { EditorView } from "@codemirror/view";
import {
	Alert,
	Box,
	Button,
	Group,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { surrealql } from "@surrealdb/codemirror";
import { Icon, iconPlus, iconWarning } from "@surrealdb/ui";
import { omit } from "radash";
import { useLayoutEffect, useMemo, useState } from "react";
import { RecordId, StringRecordId, Table } from "surrealdb";
import { CodeEditor } from "~/components/CodeEditor";
import { CodeInput } from "~/components/Inputs";
import { Label } from "~/components/Label";
import { surqlLinting } from "~/editor";
import { useTableNames, useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useValueValidator } from "~/hooks/surrealql";
import {
	executeQuery,
	getSurrealQL,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import type { QueryResponse } from "~/types";
import { RecordsChangedEvent } from "~/util/global-events";
import { extractEdgeRecords, getTableVariant } from "~/util/schema";
import classes from "../style.module.scss";

type EdgeInfo = [string[], string[]];

export interface CreateTabProps {
	table: string;
	content?: any;
	onCreated: () => void;
}

export function CreateTab({ table, content, onCreated }: CreateTabProps) {
	const [recordTable, setRecordTable] = useState("");
	const [recordId, setRecordId] = useInputState("");
	const [recordBody, setRecordBody] = useInputState("");
	const [recordFrom, setRecordFrom] = useInputState("");
	const [recordTo, setRecordTo] = useState("");
	const [isValid, body] = useValueValidator(recordBody);
	const [errors, setErrors] = useState<string[]>([]);
	const tables = useTableNames();

	const tableInfo = useTables().find((t) => t.schema.name === recordTable);
	const isRelation = tableInfo ? getTableVariant(tableInfo) === "relation" : false;

	const [fromTables, toTables]: EdgeInfo = tableInfo ? extractEdgeRecords(tableInfo) : [[], []];

	const handleSubmit = useStable(async () => {
		if (!isValid) {
			return;
		}

		const id = recordId ? new RecordId(recordTable, recordId) : new Table(recordTable);

		let response: QueryResponse[];

		if (isRelation) {
			const from = new StringRecordId(recordFrom);
			const to = new StringRecordId(recordTo);

			const relationContent = {
				...body,
				in: from,
				out: to,
			};

			response = await executeQuery(/* surql */ `RELATE $from->$id->$to CONTENT $content`, {
				from,
				id,
				to,
				content: relationContent,
			});
		} else {
			response = await executeQuery(/* surql */ `CREATE $id CONTENT $body`, { id, body });
		}

		const submitErrors = response.flatMap((r) => {
			if (r.success) return [];

			return [(r.result as string).replace("There was a problem with the database: ", "")];
		});

		setErrors(submitErrors);

		if (submitErrors.length === 0) {
			RecordsChangedEvent.dispatch(null);
			onCreated();
		}
	});

	const setCursor = useStable((view: EditorView) => {
		if (content) {
			const length = view.state.doc.length;

			view.dispatch({ selection: { anchor: length, head: length } });
		} else {
			view.dispatch({ selection: { anchor: 6, head: 6 } });
		}
	});

	useLayoutEffect(() => {
		const initializeBody = async () => {
			const bodyText = content
				? await getSurrealQL().formatValue(omit(content, ["id", "in", "out"]), true, true)
				: "{\n    \n}";

			setErrors([]);
			setRecordTable(table);
			setRecordId("");
			setRecordBody(bodyText);
			setRecordFrom("");
			setRecordTo("");
		};

		initializeBody();
	}, [table, content]);

	const extensions = useMemo(() => [surrealql(), surqlLinting()], []);
	const isFullyValid = isValid && (!isRelation || (recordFrom && recordTo));

	return (
		<Stack
			flex={1}
			gap="md"
			className={classes.createTab}
		>
			{errors.map((error, i) => (
				<Alert
					key={i}
					icon={<Icon path={iconWarning} />}
					color="red.5"
					style={{
						whiteSpace: "pre-wrap",
					}}
				>
					{error}
				</Alert>
			))}

			<SimpleGrid cols={2}>
				<Select
					data={tables}
					label="Table"
					value={recordTable}
					onChange={setRecordTable as any}
				/>
				<TextInput
					label="Id"
					value={recordId}
					spellCheck={false}
					onChange={setRecordId}
					placeholder="Leave empty to generate"
				/>
			</SimpleGrid>

			{isRelation && (
				<SimpleGrid cols={2}>
					<CodeInput
						value={recordFrom}
						onChange={setRecordFrom}
						placeholder="table:id"
						label={
							<Box>
								<Text>From record</Text>
								{fromTables.length > 0 && (
									<Text c="obsidian">Valid tables: {fromTables.join(", ")}</Text>
								)}
							</Box>
						}
					/>
					<CodeInput
						value={recordTo}
						onChange={setRecordTo}
						placeholder="table:id"
						label={
							<Box>
								<Text>To record</Text>
								{toTables.length > 0 && (
									<Text c="obsidian">Valid tables: {toTables.join(", ")}</Text>
								)}
							</Box>
						}
					/>
				</SimpleGrid>
			)}

			<Box
				flex={1}
				pos="relative"
			>
				<Label>Contents</Label>
				<CodeEditor
					pos="absolute"
					top={18}
					left={0}
					right={0}
					bottom={0}
					autoFocus
					lineNumbers
					value={recordBody}
					onChange={setRecordBody}
					extensions={extensions}
					onMount={setCursor}
				/>
			</Box>

			<Group justify="flex-end">
				<Button
					disabled={!isFullyValid}
					variant="gradient"
					onClick={handleSubmit}
					rightSection={<Icon path={iconPlus} />}
				>
					Create {isRelation ? "relation" : "record"}
				</Button>
			</Group>
		</Stack>
	);
}
