import classes from './style.module.scss';
import { ActionIcon, Button, Group, Modal, ScrollArea, Text, TextInput, Title } from "@mantine/core";
import { mdiClose, mdiMagnify, mdiPlus, mdiRefresh, mdiTable, mdiVectorLine, mdiViewSequential } from "@mdi/js";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { OpenFn, TableDefinition } from '~/types';
import { useIsLight } from '~/hooks/theme';
import { useInputState } from '@mantine/hooks';
import { useStoreValue } from '~/store';
import { extractEdgeRecords, fetchDatabaseSchema } from '~/util/schema';
import { useHasSchemaAccess } from '~/hooks/schema';
import { sort } from 'radash';
import { useIsConnected } from '~/hooks/connection';
import { adapter } from '~/adapter';
import { Spacer } from '~/components/Spacer';
import { TableCreator } from '~/components/TableCreator';

export interface TablesPaneProps {
	active: string | null;
	onSelectTable: OpenFn;
	onRefresh?: () => void;
}

export function TablesPane({ active, onSelectTable, onRefresh }: TablesPaneProps) {
	const isLight = useIsLight();
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [search, setSearch] = useInputState('');
	const schema = useStoreValue(state => state.databaseSchema);
	const hasAccess = useHasSchemaAccess();
	const isOnline = useIsConnected();

	const tablesFiltered = useMemo(() => {
		const needle = search.toLowerCase();

		const tables = search
			? schema.filter(table => table.schema.name.toLowerCase().includes(needle))
			: schema;

		return sort(tables, (table) => {
			const [isEdge] = extractEdgeRecords(table);

			return Number(isEdge);
		});
	}, [schema, search]);

	const activeTable = useMemo(() => {
		return schema.find(table => table.schema.name === active);
	}, [schema, active]);

	const selectTable = (table: TableDefinition | null) => {
		onSelectTable(table?.schema?.name || null);
	};

	const refreshTables = useStable(async () => {
		fetchDatabaseSchema();
	});

	const requestDelete = useStable((e: React.MouseEvent) => {
		e.stopPropagation();
		setIsDeleting(true);
	});

	const closeDelete = useStable(() => {
		setIsDeleting(false);
	});

	const handleDelete = useStable(async () => {
		const surreal = adapter.getActiveSurreal();

		await surreal.query('REMOVE TABLE ' + activeTable!.schema.name);
 
		closeDelete();
		fetchDatabaseSchema();
		onRefresh?.();
	});

	const openCreator = useStable(() => {
		setIsCreating(true);
	});

	const closeCreator = useStable(() => {
		setIsCreating(false);
	});

	return (
		<Panel
			title="Tables"
			icon={mdiViewSequential}
			rightSection={
				<Group noWrap>
					<ActionIcon
						title="Refresh"
						onClick={refreshTables}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
					<ActionIcon
						title="Create table..."
						onClick={openCreator}
					>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
				</Group>
			}
		>
			<TextInput
				placeholder="Search table..."
				icon={<Icon path={mdiMagnify} />}
				value={search}
				onChange={setSearch}
				mb="lg"
			/>

			{isOnline && tablesFiltered.length === 0 ? (
				<Text align="center" pt="sm" c="light.5">
					{hasAccess ? 'No tables found' : 'Unsupported auth mode'}
				</Text>
			) : (isOnline ? (
				<ScrollArea
					classNames={{
						viewport: classes.viewport
					}}
					style={{
						position: 'absolute',
						inset: 12,
						top: 46
					}}
				>
					{tablesFiltered.map(table => {
						const isActive = active == table.schema.name;
						const [isEdge] = extractEdgeRecords(table);

						return (
							<Group
								py="xs"
								px="xs"
								noWrap
								spacing="xs"
								key={table.schema.name}
								className={classes.tableEntry}
								onClick={() => selectTable(table)}
								sx={theme => ({
									backgroundColor: isActive ? theme.fn.rgba(theme.fn.themeColor('surreal'), 0.125) : undefined,
									borderRadius: 8
								})}
							>
								<Icon
									style={{ flexShrink: 0 }}
									color={isActive ? 'surreal' : (isLight ? 'light.3' : 'light.5')}
									path={isEdge ? mdiVectorLine : mdiTable}
									size="sm"
								/>

								<Text
									color={isActive ? (isLight ? 'black' : 'white') : (isLight ? 'light.7' : 'light.1')}
									style={{
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
										marginRight: 18
									}}
								>
									{table.schema.name}
								</Text>

								<Spacer />
								
								{isActive && (
									<ActionIcon
										style={{ position: 'absolute', right: 8 }}
										onClick={requestDelete}
										title="Delete table"
										color="surreal"
									>
										<Icon
											path={mdiClose}
										/>
									</ActionIcon>
								)}
							</Group>
						);
					})}
				</ScrollArea>
			) : (
				<Text align="center" pt="sm" c="light.5">
					Not connected
				</Text>
			))}

			<Modal
				opened={isDeleting}
				onClose={closeDelete}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Are you sure?
					</Title>
				}
			>
				<Text color={isLight ? 'light.6' : 'light.1'}>
					You are about to delete this table. This action cannot be undone,
					and all data within it will be lost.
				</Text>
				<Group mt="lg">
					<Button
						onClick={closeDelete}
						color={isLight ? 'light.5' : 'light.3'}
						variant="light"
					>
						Close
					</Button>
					<Spacer />
					<Button
						color="red"
						onClick={handleDelete}
					>
						Delete
					</Button>
				</Group>
			</Modal>

			<TableCreator
				opened={isCreating}
				onClose={closeCreator}
			/>
		</Panel>
	);
}