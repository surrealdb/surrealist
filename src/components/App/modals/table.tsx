import {
	Button,
	Group,
	Modal,
	MultiSelect,
	SegmentedControl,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon } from "@surrealdb/ui";
import { useLayoutEffect, useMemo, useState } from "react";
import { escapeIdent } from "surrealdb";
import { Form } from "~/components/Form";
import { CodeInput } from "~/components/Inputs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { SCHEMA_MODES } from "~/constants";
import { useConnectionAndView, useIntent } from "~/hooks/routing";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useInterfaceStore } from "~/stores/interface";
import { type SchemaMode, TableVariant } from "~/types";
import { tagEvent } from "~/util/analytics";
import { iconPlus, iconRelation, iconSearch, iconTable } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";

export function TableCreatorModal() {
	const { openTableCreator, closeTableCreator } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showTableCreator);
	const tables = useTableNames();
	const [, view] = useConnectionAndView();

	const [createType, setCreateType] = useState<TableVariant>("normal");
	const [tableName, setTableName] = useInputState("");
	const [tableIn, setTableIn] = useState<string[]>([]);
	const [tableOut, setTableOut] = useState<string[]>([]);
	const [tableView, setTableView] = useState("");
	const [mode, setMode] = useState<SchemaMode>("schemaless");

	const createTable = useStable(async () => {
		let query = `DEFINE TABLE ${escapeIdent(tableName)} ${mode.toUpperCase()} TYPE `;

		if (createType === "relation") {
			const inTables = tableIn.map((t) => escapeIdent(t)).join("|");
			const outTables = tableOut.map((t) => escapeIdent(t)).join("|");

			query += `RELATION IN ${inTables} OUT ${outTables};`;

			query += `DEFINE FIELD in ON ${escapeIdent(tableName)} TYPE record<${inTables}>;`;
			query += `DEFINE FIELD out ON ${escapeIdent(tableName)} TYPE record<${outTables}>;`;
		} else {
			query += "NORMAL";

			if (createType === "view") {
				query += ` AS ${tableView}`;
			}

			query += ";";
		}

		closeTableCreator();

		await executeQuery(query);
		await syncConnectionSchema({
			tables: [tableName],
		});

		if (view === "explorer") {
			dispatchIntent("explore-table", {
				table: tableName,
			});
		}

		tagEvent("table_created");
	});

	useLayoutEffect(() => {
		if (opened) {
			setTableName("");
			setCreateType("normal");
			setTableIn([]);
			setTableOut([]);
		}
	}, [opened]);

	useIntent("new-table", openTableCreator);

	const isValid = useMemo(() => {
		if (!tableName) return false;

		if (createType === "relation") {
			return tableIn.length > 0 && tableOut.length > 0;
		}

		if (createType === "view") {
			return tableView.length > 0;
		}

		return true;
	}, [tableName, tableIn, tableOut, createType, tableView]);

	return (
		<Modal
			opened={opened}
			onClose={closeTableCreator}
			trapFocus={false}
			size="md"
			title={<PrimaryTitle>Create new table</PrimaryTitle>}
		>
			<SegmentedControl
				fullWidth
				variant="gradient"
				data={[
					{
						value: "normal",
						label: (
							<Group
								justify="center"
								gap="xs"
							>
								<Icon path={iconTable} />
								Table
							</Group>
						),
					},
					{
						value: "relation",
						label: (
							<Group
								justify="center"
								gap="xs"
							>
								<Icon path={iconRelation} />
								Relation
							</Group>
						),
					},
					{
						value: "view",
						label: (
							<Group
								justify="center"
								gap="xs"
							>
								<Icon path={iconSearch} />
								View
							</Group>
						),
					},
				]}
				value={createType}
				onChange={setCreateType as any}
				mb={32}
			/>

			<Form onSubmit={createTable}>
				<Stack gap="xl">
					<TextInput
						label="Table name"
						value={tableName}
						spellCheck={false}
						onChange={setTableName}
						placeholder="my_table"
						autoFocus
					/>
					<Select
						data={SCHEMA_MODES}
						value={mode}
						onChange={setMode as any}
						label="Schema mode"
					/>
					{createType === "relation" && (
						<>
							<MultiSelect
								data={tables}
								label="Incoming tables"
								searchable
								value={tableIn}
								onChange={setTableIn}
							/>

							<MultiSelect
								data={tables}
								label="Outgoing tables"
								searchable
								value={tableOut}
								onChange={setTableOut}
							/>
						</>
					)}
					{createType === "view" && (
						<CodeInput
							label="View query"
							value={tableView}
							onChange={setTableView}
							placeholder="Write a SELECT query..."
							multiline
							height={84}
						/>
					)}

					<Group mt="lg">
						<Button
							onClick={closeTableCreator}
							color="slate"
							variant="light"
							flex={1}
						>
							Close
						</Button>
						<Button
							type="submit"
							variant="gradient"
							flex={1}
							disabled={!isValid}
							rightSection={<Icon path={iconPlus} />}
						>
							Create
						</Button>
					</Group>
				</Stack>
			</Form>
		</Modal>
	);
}
