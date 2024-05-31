import {
	Button,
	Group,
	Modal,
	MultiSelect,
	Stack,
	Tabs,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { executeQuery } from "~/connection";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { tb } from "~/util/helpers";
import { iconPlus, iconRelation, iconTable } from "~/util/icons";
import { syncDatabaseSchema } from "~/util/schema";
import { Form } from "../../Form";
import { ModalTitle } from "../../ModalTitle";

export function TableCreator() {
	const { openTableCreator, closeTableCreator } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showTableCreator);

	const [createType, setCreateType] = useState("table");
	const [tableName, setTableName] = useInputState("");
	const [tableIn, setTableIn] = useState<string[]>([]);
	const [tableOut, setTableOut] = useState<string[]>([]);
	const tableList = useTableNames("TABLE");

	const createTable = useStable(async () => {
		let query = `DEFINE TABLE ${tb(tableName)} TYPE `;

		if (createType === "relation") {
			const inTables = tableIn.map((t) => tb(t)).join("|");
			const outTables = tableOut.map((t) => tb(t)).join("|");

			query += `RELATION IN ${inTables} OUT ${outTables};`;

			query += `DEFINE FIELD in ON ${tb(tableName)} TYPE record<${inTables}>;`;
			query += `DEFINE FIELD out ON ${tb(
				tableName,
			)} TYPE record<${outTables}>;`;
		} else {
			query += "NORMAL;";
		}

		closeTableCreator();

		await executeQuery(query);
		await syncDatabaseSchema({
			tables: [tableName],
		});

		const { activeView } = useConfigStore.getState();

		if (activeView === "explorer") {
			dispatchIntent("explore-table", {
				table: tableName,
			});
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: ignoring
	useLayoutEffect(() => {
		if (opened) {
			setTableName("");
			setTableIn([]);
			setTableOut([]);
		}
	}, [opened]);

	useIntent("new-table", openTableCreator);

	return (
		<>
			<Modal
				opened={opened}
				onClose={closeTableCreator}
				trapFocus={false}
				size="sm"
				title={<ModalTitle>{`Create new ${createType}`}</ModalTitle>}
			>
				<Tabs
					mb="xl"
					defaultValue="table"
					value={createType}
					onChange={setCreateType as any}
				>
					<Tabs.List grow>
						<Tabs.Tab value="table" rightSection={<Icon path={iconTable} />}>
							Table
						</Tabs.Tab>
						<Tabs.Tab
							value="relation"
							rightSection={<Icon path={iconRelation} />}
						>
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
									data={tableList}
									placeholder="Select incoming tables"
									value={tableIn}
									onChange={setTableIn}
								/>

								<MultiSelect
									data={tableList}
									placeholder="Select outgoing tables"
									value={tableOut}
									onChange={setTableOut}
								/>
							</>
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
								disabled={
									!tableName ||
									(createType === "relation" && (!tableIn || !tableOut))
								}
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
