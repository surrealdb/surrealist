import classes from "./style.module.scss";
import { ActionIcon, Badge, Button, Divider, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { mdiMagnify, mdiPin, mdiPinOff, mdiPlus, mdiTable, mdiVectorLine, mdiViewSequential } from "@mdi/js";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsLight } from "~/hooks/theme";
import { useInputState } from "@mantine/hooks";
import { extractEdgeRecords } from "~/util/schema";
import { useHasSchemaAccess, useTables } from "~/hooks/schema";
import { sort } from "radash";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { Spacer } from "~/components/Spacer";
import { TableCreator } from "~/components/TableCreator";
import { useExplorerStore } from "~/stores/explorer";
import { useConfigStore } from "~/stores/config";
import clsx from "clsx";
import { Importer } from "../Importer";
import { Exporter } from "../Exporter";
import { useContextMenu } from "mantine-contextmenu";

export interface TablesPaneProps {
	openRecordCreator: (table: string) => void;
}

export function TablesPane(props: TablesPaneProps) {
	const toggleTablePin = useConfigStore((s) => s.toggleTablePin);
	const isLight = useIsLight();
	const [isCreating, setIsCreating] = useState(false);
	const [search, setSearch] = useInputState("");
	const hasAccess = useHasSchemaAccess();
	const connection = useActiveConnection();
	const isOnline = useIsConnected();
	const schema = useTables();

	const { showContextMenu } = useContextMenu();

	const activeTable = useExplorerStore((s) => s.activeTable);
	const setExplorerTable = useExplorerStore((s) => s.setExplorerTable);

	const isPinned = useStable((table: string) => {
		return connection.pinnedTables.includes(table);
	});

	const tablesFiltered = useMemo(() => {
		const needle = search.toLowerCase();

		const tables = search ? schema.filter((table) => table.schema.name.toLowerCase().includes(needle)) : schema;

		return sort(tables, (table) => {
			const [isEdge] = extractEdgeRecords(table);
			const pinned = isPinned(table.schema.name);

			return Number(isEdge) - (pinned ? 999 : 0);
		});
	}, [schema, search, connection.pinnedTables]);

	const openCreator = useStable(() => {
		setIsCreating(true);
	});

	const closeCreator = useStable(() => {
		setIsCreating(false);
	});

	const togglePinned = useStable((table: string) => {
		if (table && connection) {
			toggleTablePin(table);
		}
	});

	return (
		<ContentPane
			title="Tables"
			icon={mdiViewSequential}
			leftSection={
				schema.length > 0 && (
					<Badge
						color={isLight ? "slate.0" : "slate.9"}
						radius="sm"
						c="inherit"
					>
						{schema.length}
					</Badge>
				)
			}
			rightSection={
				<ActionIcon title="Create table..." onClick={openCreator}>
					<Icon path={mdiPlus} />
				</ActionIcon>
			}
		>
			<Stack
				pos="absolute"
				top={0}
				left={12}
				right={12}
				bottom={12}
				gap={0}
			>
				<ScrollArea>
					<Stack gap="xs">
						{isOnline && (
							<TextInput
								placeholder="Search tables..."
								leftSection={<Icon path={mdiMagnify} />}
								value={search}
								onChange={setSearch}
								variant="unstyled"
								autoFocus
							/>
						)}

						{isOnline ? (tablesFiltered.length === 0 && (
							<Text ta="center" pt="sm" c="light.5">
								{hasAccess ? "No tables found" : "Unsupported auth mode"}
							</Text>
						)) : (
							<Text ta="center" pt="sm" c="light.5">
								Not connected
							</Text>
						)}

						{tablesFiltered.map((table) => {
							const isActive = activeTable == table.schema.name;
							const isPinned = connection.pinnedTables.includes(table.schema.name);
							const [isEdge] = extractEdgeRecords(table);

							return (
								<Button
									key={table.schema.name}
									fullWidth
									miw={0}
									px={8}
									color="slate"
									variant={isActive ? "light" : "subtle"}
									onClick={() => setExplorerTable(table.schema.name)}
									className={clsx(classes.table, isActive && classes.tableActive)}
									onContextMenu={showContextMenu([
										{
											key: 'open',
											title: "View table records",
											icon: <Icon path={mdiTable} />,
											onClick: () => setExplorerTable(table.schema.name)
										},
										{
											key: 'new',
											title: "Create new record",
											icon: <Icon path={mdiPlus} />,
											onClick: () => props.openRecordCreator(table.schema.name)
										},
										{
											key: 'pin',
											title: isPinned ? "Unpin table" : "Pin table",
											icon: <Icon path={isPinned ? mdiPinOff : mdiPin} />,
											onClick: () => togglePinned(table.schema.name)
										}
									])}
									styles={{
										label: {
											flex: 1
										}
									}}
									leftSection={
										<Icon
											path={isEdge ? mdiVectorLine : mdiTable}
											color={isActive ? "surreal" : isLight ? "slate.2" : "slate.4"}
										/>
									}
									rightSection={
										isPinned && (
											<Icon
												title="Pinned table"
												path={mdiPin}
												size="sm"
											/>
										)
									}
								>
									{table.schema.name}
								</Button>
							);
						})}
					</Stack>
				</ScrollArea>
				<Spacer />
				<Divider mb="xs" />
				<Stack>
					<Text
						c="slate"
						fz="lg"
						fw={500}
					>
						Actions
					</Text>
					<Importer />
					<Exporter />
				</Stack>
			</Stack>

			<TableCreator
				opened={isCreating}
				onClose={closeCreator} 
			/>
		</ContentPane>
	);
}
