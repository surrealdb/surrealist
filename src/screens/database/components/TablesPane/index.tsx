import {
	iconAPI,
	iconChevronLeft,
	iconDelete,
	iconPin,
	iconPinOff,
	iconPlus,
	iconRelation,
	iconSearch,
	iconTable,
} from "~/util/icons";

import { Badge, Divider, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { type ContextMenuItemOptions, useContextMenu } from "mantine-contextmenu";
import { sort } from "radash";
import { useMemo } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useHasSchemaAccess, useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { showTableDefinitionModal } from "~/modals/table-definition";
import { useConfirmation } from "~/providers/Confirmation";
import { executeQuery } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { fuzzyMultiMatch, tb } from "~/util/helpers";
import { extractEdgeRecords, syncConnectionSchema } from "~/util/schema";
import classes from "./style.module.scss";

export interface TablesPaneProps {
	icon?: string;
	activeTable?: string | undefined;
	closeDisabled?: boolean;
	extraSection?: React.ReactNode;
	onClose?: () => void;
	onTableSelect: (table: string) => void;
	onTableContextMenu?: (table: string) => ContextMenuItemOptions[];
}

export function TablesPane({
	icon,
	activeTable,
	closeDisabled,
	extraSection,
	onClose,
	onTableSelect,
	onTableContextMenu,
}: TablesPaneProps) {
	const { openTableCreator } = useInterfaceStore.getState();

	const toggleTablePin = useConfigStore((s) => s.toggleTablePin);
	const isLight = useIsLight();
	const [search, setSearch] = useInputState("");
	const hasAccess = useHasSchemaAccess();
	const connection = useActiveConnection();
	const isConnected = useIsConnected();
	const schema = useTables();

	const { showContextMenu } = useContextMenu();

	const tablesFiltered = useMemo(() => {
		const needle = search.toLowerCase();
		const tables = search
			? schema.filter((table) => fuzzyMultiMatch(needle, table.schema.name))
			: schema;

		return sort(tables, (table) => {
			const [isEdge] = extractEdgeRecords(table);
			const pinned = connection.pinnedTables.includes(table.schema.name);

			return Number(isEdge) - (pinned ? 999 : 0);
		});
	}, [connection.pinnedTables, schema, search]);

	const togglePinned = useStable((table: string) => {
		if (table && connection) {
			toggleTablePin(table);
		}
	});

	const removeTable = useConfirmation({
		message:
			"You are about to remove this table and all data contained within it. This action cannot be undone.",
		confirmText: "Remove",
		onConfirm: async (table: string) => {
			await executeQuery(`REMOVE TABLE ${tb(table)}`);
			await syncConnectionSchema({
				tables: [table],
			});

			if (activeTable === table) {
				onTableSelect("");
			}
		},
	});

	return (
		<ContentPane
			title="Tables"
			icon={icon}
			style={{ flexShrink: 0 }}
			infoSection={
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
				<>
					{onClose && (
						<ActionButton
							label="Hide tables"
							disabled={closeDisabled}
							onClick={onClose}
						>
							<Icon path={iconChevronLeft} />
						</ActionButton>
					)}
					<ActionButton
						label="New table"
						onClick={openTableCreator}
						disabled={!isConnected}
					>
						<Icon path={iconPlus} />
					</ActionButton>
				</>
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
				<ScrollArea
					classNames={{
						viewport: classes.scroller,
					}}
				>
					<Stack
						gap="xs"
						pb="md"
					>
						{isConnected && schema.length > 0 && (
							<TextInput
								placeholder="Search tables..."
								leftSection={<Icon path={iconSearch} />}
								value={search}
								spellCheck={false}
								onChange={setSearch}
								variant="unstyled"
								autoFocus
							/>
						)}

						{isConnected ? (
							tablesFiltered.length === 0 && (
								<Text
									c="slate"
									ta="center"
									mt="lg"
								>
									{hasAccess ? "No tables found" : "Unsupported auth mode"}
								</Text>
							)
						) : (
							<Text
								c="slate"
								ta="center"
								mt="lg"
							>
								Not connected
							</Text>
						)}

						{tablesFiltered.map((table) => {
							const isActive = activeTable === table.schema.name;
							const isPinned = connection.pinnedTables.includes(table.schema.name);
							const [isEdge] = extractEdgeRecords(table);

							return (
								<Entry
									key={table.schema.name}
									isActive={isActive}
									onClick={() => onTableSelect(table.schema.name)}
									onContextMenu={showContextMenu([
										...(onTableContextMenu?.(table.schema.name) || []),
										{
											key: "divider-1",
										},
										{
											key: "pin",
											title: isPinned ? "Unpin table" : "Pin table",
											icon: <Icon path={isPinned ? iconPinOff : iconPin} />,
											onClick: () => togglePinned(table.schema.name),
										},
										{
											key: "definition",
											title: "Show definition",
											icon: <Icon path={iconAPI} />,
											onClick: () =>
												showTableDefinitionModal(table.schema.name),
										},
										{
											key: "divider-2",
										},
										{
											key: "remove",
											title: "Remove table",
											color: "pink.7",
											icon: <Icon path={iconDelete} />,
											onClick: () => removeTable(table.schema.name),
										},
									])}
									leftSection={<Icon path={isEdge ? iconRelation : iconTable} />}
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
									<Text
										style={{
											textOverflow: "ellipsis",
											overflow: "hidden",
										}}
									>
										{table.schema.name}
									</Text>
								</Entry>
							);
						})}
					</Stack>
				</ScrollArea>
				{extraSection && (
					<>
						<Spacer />
						<Divider mb="xs" />
						{extraSection}
					</>
				)}
			</Stack>
		</ContentPane>
	);
}
