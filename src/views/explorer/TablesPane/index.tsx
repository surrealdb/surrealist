import classes from "./style.module.scss";
import { ActionIcon, Group, ScrollArea, Text, TextInput } from "@mantine/core";
import { mdiMagnify, mdiPin, mdiPlus, mdiTable, mdiVectorLine, mdiViewSequential } from "@mdi/js";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { useIsLight } from "~/hooks/theme";
import { useInputState } from "@mantine/hooks";
import { store } from "~/store";
import { extractEdgeRecords } from "~/util/schema";
import { useHasSchemaAccess, useTables } from "~/hooks/schema";
import { sort } from "radash";
import { useIsConnected } from "~/hooks/connection";
import { Spacer } from "~/components/Spacer";
import { TableCreator } from "~/components/TableCreator";
import { useActiveSession } from "~/hooks/environment";
import { useStoreState } from "~/hooks/store";
import { setExplorerTable } from "~/stores/explorer";
import { toggleTablePin } from "~/stores/config";

export function TablesPane() {
	const isLight = useIsLight();
	const [isCreating, setIsCreating] = useState(false);
	const [search, setSearch] = useInputState("");
	const hasAccess = useHasSchemaAccess();
	const isOnline = useIsConnected();
	const sessionInfo = useActiveSession();
	const schema = useTables();

	const [active, setActive] = useStoreState(
		(state) => state.explorer.activeTable,
		(value) => setExplorerTable(value)
	);

	const isPinned = useStable((table: string) => {
		return sessionInfo?.pinnedTables?.includes(table) || false;
	});

	const tablesFiltered = useMemo(() => {
		const needle = search.toLowerCase();

		const tables = search ? schema.filter((table) => table.schema.name.toLowerCase().includes(needle)) : schema;

		return sort(tables, (table) => {
			const [isEdge] = extractEdgeRecords(table);
			const pinned = isPinned(table.schema.name);

			return Number(isEdge) - (pinned ? 999 : 0);
		});
	}, [schema, search, sessionInfo?.pinnedTables]);

	const openCreator = useStable(() => {
		setIsCreating(true);
	});

	const closeCreator = useStable(() => {
		setIsCreating(false);
	});

	const togglePinned = useStable((e: any, table: string) => {
		e.stopPropagation();

		if (!table || !sessionInfo) return;

		store.dispatch(toggleTablePin({
			session: sessionInfo.id,
			table,
		}));
	});

	return (
		<Panel
			title="Tables"
			icon={mdiViewSequential}
			rightSection={
				<Group noWrap>
					<ActionIcon title="Create table..." onClick={openCreator}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
				</Group>
			}>
			<TextInput
				placeholder="Search table..."
				icon={<Icon path={mdiMagnify} />}
				value={search}
				onChange={setSearch}
				mb="lg"
			/>

			{isOnline && tablesFiltered.length === 0 ? (
				<Text align="center" pt="sm" c="light.5">
					{hasAccess ? "No tables found" : "Unsupported auth mode"}
				</Text>
			) : isOnline ? (
				<ScrollArea
					classNames={{
						viewport: classes.viewport,
					}}
					style={{
						position: "absolute",
						inset: 12,
						top: 42,
					}}>
					{tablesFiltered.map((table) => {
						const isActive = active == table.schema.name;
						const isPinned = sessionInfo?.pinnedTables?.includes(table.schema.name);
						const [isEdge] = extractEdgeRecords(table);

						return (
							<Group
								py="xs"
								px="xs"
								noWrap
								spacing={6}
								title={`Double-click to ${isPinned ? 'unpin' : 'pin'} table`}
								key={table.schema.name}
								className={classes.tableEntry}
								onClick={() => setActive(table.schema.name)}
								onDoubleClick={(e) => togglePinned(e, table.schema.name)}
								sx={(theme) => ({
									backgroundColor: isActive ? theme.fn.rgba(theme.fn.themeColor("surreal"), 0.125) : undefined,
									borderRadius: 8,
								})}
							>
								<Icon
									style={{ flexShrink: 0 }}
									color={isActive ? "surreal" : isLight ? "light.3" : "light.5"}
									path={isEdge ? mdiVectorLine : mdiTable}
									size="sm"
								/>

								<Text
									color={isActive ? (isLight ? "black" : "white") : isLight ? "light.7" : "light.1"}
									className={classes.tableName}
								>
									{table.schema.name}
								</Text>

								<Spacer />

								{isPinned && (
									<Icon
										onClick={(e) => togglePinned(e, table.schema.name)}
										className={classes.pinButton}
										color={isActive ? "surreal" : isLight ? "light.3" : "light.4"}
										title="Unpin table"
										path={mdiPin}
										size="sm"
									/>
								)}
							</Group>
						);
					})}
				</ScrollArea>
			) : (
				<Text align="center" pt="sm" c="light.5">
					Not connected
				</Text>
			)}

			<TableCreator
				opened={isCreating}
				onClose={closeCreator} 
			/>
		</Panel>
	);
}
