import { Button, Group, Modal, MultiSelect, Stack, Tabs, TextInput, Title } from "@mantine/core";
import { mdiPlus, mdiTable, mdiVectorLine } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { useIsLight } from '~/hooks/theme';
import { useInputState } from '@mantine/hooks';
import { Form } from '../Form';
import { Spacer } from '../Spacer';
import { fetchDatabaseSchema } from '~/util/schema';
import { useTableNames } from '~/hooks/schema';
import { adapter } from '~/adapter';

export interface TableCreatorProps {
	opened: boolean;
	onClose: () => void;
}

export function TableCreator({ opened, onClose }: TableCreatorProps) {
	const isLight = useIsLight();
	const [createType, setCreateType] = useState('table');
	const [tableName, setTableName] = useInputState('');
	const [tableIn, setTableIn] = useState<string[]>([]);
	const [tableOut, setTableOut] = useState<string[]>([]);
	const tableList = useTableNames('TABLE');

	const createTable = useStable(async () => {
		const surreal = adapter.getActiveSurreal();

		// TODO Remove legacy support in beta 10
		
		try {
			let query = `DEFINE TABLE ${tableName};`;

			if (createType === 'relation') {
				query += 'DEFINE FIELD in ON ' + tableName + ' TYPE record<' + tableIn.join('|') + '>;';
				query += 'DEFINE FIELD out ON ' + tableName + ' TYPE record<' + tableOut.join('|') + '>;';
			}

			await surreal.query(query);
		} catch {
			let query = `DEFINE TABLE ${tableName};`;

			if (createType === 'relation') {
				query += 'DEFINE FIELD in ON ' + tableName + ' TYPE record(' + tableIn.join(',') + ');';
				query += 'DEFINE FIELD out ON ' + tableName + ' TYPE record(' + tableOut.join(',') + ');';
			}

			await surreal.query(query);
		}

		onClose();
		fetchDatabaseSchema();
	});

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				trapFocus={false}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Create new {createType}
					</Title>
				}
			>
				<Tabs
					mb="xl"
					defaultValue="table"
					value={createType}
					onTabChange={setCreateType as any}
				>
					<Tabs.List grow>
						<Tabs.Tab value="table" icon={<Icon path={mdiTable} />}>Table</Tabs.Tab>
						<Tabs.Tab value="relation" icon={<Icon path={mdiVectorLine} />}>Relation</Tabs.Tab>
					</Tabs.List>
				</Tabs>

				<Form onSubmit={createTable}>
					<Stack>
						<TextInput
							placeholder="Enter table name"
							value={tableName}
							onChange={setTableName}
							autoFocus
						/>
						{createType === 'relation' && (
							<>
								<MultiSelect
									data={tableList}
									placeholder="Enter in"
									value={tableIn}
									onChange={setTableIn}
								/>
								<MultiSelect
									data={tableList}
									placeholder="Enter out"
									value={tableOut}
									onChange={setTableOut}
								/>
							</>	
						)}
						<Group mt="lg">
							<Button
								onClick={onClose}
								color={isLight ? 'light.5' : 'light.3'}
								variant="light"
							>
								Close
							</Button>
							<Spacer />
							<Button
								color="surreal"
								type="submit"
								disabled={!tableName || (createType === 'relation' && (!tableIn || !tableOut))}
								rightIcon={<Icon path={mdiPlus} />}
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