import { ActionIcon, Badge, Divider, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
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
import { Importer } from "../Importer";
import { Exporter } from "../Exporter";
import { useContextMenu } from "mantine-contextmenu";
import { iconList, iconPin, iconPinOff, iconPlus, iconRelation, iconSearch, iconTable } from "~/util/icons";
import { Entry } from "~/components/Entry";

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
			icon={iconList}
			w={325}
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
					<Icon path={iconPlus} />
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
					<Stack gap="xs" pb="md">
						{isOnline && (
							<TextInput
								placeholder="Search tables..."
								leftSection={<Icon path={iconSearch} />}
								value={search}
								onChange={setSearch}
								variant="unstyled"
								autoFocus
								mt={-8}
							/>
						)}

						{isOnline ? (tablesFiltered.length === 0 && (
							<Text ta="center" pt="sm" c="slate">
								{hasAccess ? "No tables found" : "Unsupported auth mode"}
							</Text>
						)) : (
							<Text ta="center" pt="sm" c="slate">
								Not connected
							</Text>
						)}

						{tablesFiltered.map((table) => {
							const isActive = activeTable == table.schema.name;
							const isPinned = connection.pinnedTables.includes(table.schema.name);
							const [isEdge] = extractEdgeRecords(table);

							return (
								<Entry
									key={table.schema.name}
									isActive={isActive}
									onClick={() => setExplorerTable(table.schema.name)}
									// className={clsx(classes.table)}
									onContextMenu={showContextMenu([
										{
											key: 'open',
											title: "View table records",
											icon: <Icon path={iconTable} />,
											onClick: () => setExplorerTable(table.schema.name)
										},
										{
											key: 'new',
											title: "Create new record",
											icon: <Icon path={iconPlus} />,
											onClick: () => props.openRecordCreator(table.schema.name)
										},
										{
											key: 'pin',
											title: isPinned ? "Unpin table" : "Pin table",
											icon: <Icon path={isPinned ? iconPinOff : iconPin} />,
											onClick: () => togglePinned(table.schema.name)
										}
									])}
									leftSection={
										<Icon path={isEdge ? iconRelation : iconTable} />
									}
									rightSection={
										isPinned && (
											<Icon
												title="Pinned table"
												path={iconPin}
												size="sm"
											/>
										)
									}
								>
									{table.schema.name}
								</Entry>
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
