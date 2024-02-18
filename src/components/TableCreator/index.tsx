import { Button, Group, Modal, MultiSelect, Stack, Tabs, TextInput } from "@mantine/core";
import { mdiPlus, mdiTable, mdiVectorLine } from "@mdi/js";
import { useLayoutEffect, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { useInputState } from "@mantine/hooks";
import { Form } from "../Form";
import { fetchDatabaseSchema } from "~/util/schema";
import { useTableNames } from "~/hooks/schema";
import { ModalTitle } from "../ModalTitle";
import { getActiveSurreal } from "~/util/surreal";

export interface TableCreatorProps {
	opened: boolean;
	onClose: () => void;
}

export function TableCreator({ opened, onClose }: TableCreatorProps) {
	const [createType, setCreateType] = useState("table");
	const [tableName, setTableName] = useInputState("");
	const [tableIn, setTableIn] = useState<string[]>([]);
	const [tableOut, setTableOut] = useState<string[]>([]);
	const tableList = useTableNames("TABLE");

	const createTable = useStable(async () => {
		const surreal = getActiveSurreal();

		let query = `DEFINE TABLE ${tableName};`;

		if (createType === "relation") {
			query += `DEFINE FIELD in ON \`${tableName}\` TYPE record<${tableIn.join("|")}>;`;
			query += `DEFINE FIELD out ON \`${tableName}\` TYPE record<${tableOut.join("|")}>;`;
		}

		onClose();

		await surreal.query(query);
		await fetchDatabaseSchema();
	});

	useLayoutEffect(() => {
		if (opened) {
			setTableName("");
			setTableIn([]);
			setTableOut([]);
		}
	}, [opened]);

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				trapFocus={false}
				size="sm"
				title={
					<ModalTitle>{`Create new ${createType}`}</ModalTitle>
				}
			>
				<Tabs mb="xl" defaultValue="table" value={createType} onChange={setCreateType as any}>
					<Tabs.List grow>
						<Tabs.Tab value="table" rightSection={<Icon path={mdiTable} />}>
							Table
						</Tabs.Tab>
						<Tabs.Tab value="relation" rightSection={<Icon path={mdiVectorLine} />}>
							Relation
						</Tabs.Tab>
					</Tabs.List>
				</Tabs>

				<Form onSubmit={createTable}>
					<Stack>
						<TextInput placeholder="Enter table name" value={tableName} onChange={setTableName} autoFocus />
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
								onClick={onClose}
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
								rightSection={<Icon path={mdiPlus} />}
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
