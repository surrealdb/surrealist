import { Button, Group, Modal, MultiSelect, Select, Stack, Tabs, TextInput } from "@mantine/core";
import { useLayoutEffect, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { useInputState } from "@mantine/hooks";
import { syncDatabaseSchema } from "~/util/schema";
import { useTableNames } from "~/hooks/schema";
import { iconPlus, iconRelation, iconTable } from "~/util/icons";
import { useInterfaceStore } from "~/stores/interface";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { executeQuery } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { tb } from "~/util/helpers";
import { SCHEMA_MODES } from "~/constants";
import { SchemaMode } from "~/types";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";

export function TableCreatorModal() {
	const { openTableCreator, closeTableCreator } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showTableCreator);
	const tables = useTableNames("TABLE");

	const [createType, setCreateType] = useState("table");
	const [tableName, setTableName] = useInputState("");
	const [tableIn, setTableIn] = useState<string[]>([]);
	const [tableOut, setTableOut] = useState<string[]>([]);
	const [mode, setMode] = useState<SchemaMode>('schemaless');

	const createTable = useStable(async () => {
		let query = `DEFINE TABLE ${tb(tableName)} ${mode.toUpperCase()} TYPE `;

		if (createType === "relation") {
			const inTables = tableIn.map((t) => tb(t)).join('|');
			const outTables = tableOut.map((t) => tb(t)).join('|');

			query += `RELATION IN ${inTables} OUT ${outTables};`;

			query += `DEFINE FIELD in ON ${tb(tableName)} TYPE record<${inTables}>;`;
			query += `DEFINE FIELD out ON ${tb(tableName)} TYPE record<${outTables}>;`;
		} else {
			query += "NORMAL;";
		}

		closeTableCreator();

		await executeQuery(query);
		await syncDatabaseSchema({
			tables: [tableName]
		});

		const { activeView } = useConfigStore.getState();

		if (activeView === "explorer") {
			dispatchIntent("explore-table", {
				table: tableName
			});
		}
	});

	useLayoutEffect(() => {
		if (opened) {
			setTableName("");
			setTableIn([]);
			setTableOut([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened]);

	useIntent("new-table", openTableCreator);

	return (
		<>
			<Modal
				opened={opened}
				onClose={closeTableCreator}
				trapFocus={false}
				size="sm"
				title={
					<PrimaryTitle>{`Create new ${createType}`}</PrimaryTitle>
				}
			>
				<Tabs mb="xl" defaultValue="table" value={createType} onChange={setCreateType as any}>
					<Tabs.List grow>
						<Tabs.Tab value="table" rightSection={<Icon path={iconTable} />}>
							Table
						</Tabs.Tab>
						<Tabs.Tab value="relation" rightSection={<Icon path={iconRelation} />}>
							Relation
						</Tabs.Tab>
					</Tabs.List>
				</Tabs>

				<Form onSubmit={createTable}>
					<Stack>
						<TextInput
							placeholder="Enter table name"
							value={tableName}
							spellCheck={false}
							onChange={setTableName}
							autoFocus
						/>
						{createType === "relation" && (
							<>
								<MultiSelect
									data={tables}
									searchable
									placeholder="Select incoming tables"
									value={tableIn}
									onChange={setTableIn}
								/>

								<MultiSelect
									data={tables}
									searchable
									placeholder="Select outgoing tables"
									value={tableOut}
									onChange={setTableOut}
								/>
							</>
						)}
						<Select
							data={SCHEMA_MODES}
							value={mode}
							onChange={setMode as any}
						/>
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
								disabled={!tableName || (createType === "relation" && (!tableIn || !tableOut))}
								rightSection={<Icon path={iconPlus} />}
							>
								Create
							</Button>
						</Group>
					</Stack>
				</Form>
			</Modal>
		</>
	);
}
