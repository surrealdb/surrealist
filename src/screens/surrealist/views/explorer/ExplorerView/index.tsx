import { Box, Button, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useEventSubscription } from "~/hooks/event";
import { usePanelMinSize } from "~/hooks/panels";
import { useConnectionAndView, useIntent, useViewFocus } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useDesigner } from "~/providers/Designer";
import { TablesPane } from "~/screens/surrealist/components/TablesPane";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { ActivateDatabaseEvent, DisconnectedEvent } from "~/util/global-events";
import {
	iconChevronRight,
	iconDesigner,
	iconDownload,
	iconExplorer,
	iconOpen,
	iconPlus,
	iconTable,
	iconUpload,
} from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";
import { CreatorDrawer } from "../CreatorDrawer";
import { ExplorerPane } from "../ExplorerPane";

const TablesPaneLazy = memo(TablesPane);
const ExplorerPaneLazy = memo(ExplorerPane);

export function ExplorerView() {
	const { updateConnection } = useConfigStore.getState();
	const { openTableCreator: _openTableCreator } = useInterfaceStore.getState();
	const { design } = useDesigner();

	const isConnected = useIsConnected();
	const explorerTableList = useConnection((c) => c?.explorerTableList);
	const [connection] = useConnectionAndView();
	const openTableCreator = useRequireDatabase(_openTableCreator);
	const importDatabase = useRequireDatabase(() => dispatchIntent("import-database"));
	const exportDatabase = useRequireDatabase(() => dispatchIntent("export-database"));

	const [activeTable, setActiveTable] = useState<string>();
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [creatorTable, setCreatorTable] = useState<string>();
	const [creatorContent, setCreatorContent] = useState<any>();

	const openCreator = useStable((table?: string, content?: any) => {
		setCreatorTable(table || activeTable);
		setCreatorContent(content);
		isCreatingHandle.open();
	});

	const buildContextMenu = useStable((table: string) => [
		{
			key: "open",
			title: "View records",
			icon: <Icon path={iconTable} />,
			onClick: () => setActiveTable(table),
		},
		{
			key: "new",
			title: "Create new record",
			icon: <Icon path={iconPlus} />,
			onClick: () => openCreator(table),
		},
		{
			key: "design",
			title: "Open designer",
			icon: <Icon path={iconDesigner} />,
			onClick: () => design(table),
		},
	]);

	const closeTableList = useStable(() => {
		if (!connection) return;

		updateConnection({
			id: connection,
			explorerTableList: false,
		});
	});

	const resetTable = useStable(() => {
		isCreatingHandle.close();
		setActiveTable(undefined);
	});

	useEventSubscription(DisconnectedEvent, resetTable);
	useEventSubscription(ActivateDatabaseEvent, resetTable);

	useIntent("explore-table", ({ table }) => {
		setActiveTable(table);
	});

	useViewFocus("explorer", () => {
		syncConnectionSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
				pr="lg"
				pb="lg"
				pl={{ base: "lg", md: 0 }}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					{(explorerTableList || !activeTable) && (
						<>
							<Panel
								defaultSize={minSize}
								minSize={minSize}
								maxSize={35}
								id="tables"
								order={1}
							>
								<TablesPaneLazy
									icon={iconExplorer}
									activeTable={activeTable}
									closeDisabled={!activeTable}
									onTableSelect={setActiveTable}
									onTableContextMenu={buildContextMenu}
									onClose={closeTableList}
									extraSection={
										<>
											<Entry
												leftSection={<Icon path={iconUpload} />}
												rightSection={<Icon path={iconChevronRight} />}
												onClick={exportDatabase}
												style={{ flexShrink: 0 }}
												bg="transparent"
											>
												Export database
											</Entry>
											<Entry
												leftSection={<Icon path={iconDownload} />}
												rightSection={<Icon path={iconChevronRight} />}
												onClick={importDatabase}
												style={{ flexShrink: 0 }}
												bg="transparent"
											>
												Import database
											</Entry>
										</>
									}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel
						id="explorer"
						order={2}
						minSize={minSize}
					>
						{activeTable ? (
							<ExplorerPaneLazy
								activeTable={activeTable}
								onCreateRecord={openCreator}
							/>
						) : (
							<Introduction
								title="Explorer"
								icon={iconExplorer}
								snippet={{
									language: "surrealql",
									title: "SurrealQL",
									code: `
										-- Declare a new table
										DEFINE TABLE person;
										
										-- Fetch table records
										SELECT * FROM person;
									`,
								}}
							>
								<Text>
									The explorer view provides an easy way to browse your tables and
									records without writing any queries.
								</Text>
								<Group>
									<Button
										flex={1}
										variant="gradient"
										leftSection={<Icon path={iconPlus} />}
										disabled={!isConnected}
										onClick={openTableCreator}
									>
										Create table
									</Button>
									<Button
										flex={1}
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										onClick={() =>
											adapter.openUrl(
												"https://surrealdb.com/docs/surrealql/statements/define/table",
											)
										}
									>
										Learn more
									</Button>
								</Group>
							</Introduction>
						)}
					</Panel>
				</PanelGroup>
			</Box>

			<CreatorDrawer
				opened={isCreating}
				table={creatorTable || ""}
				content={creatorContent}
				onClose={isCreatingHandle.close}
			/>
		</>
	);
}

export default ExplorerView;
