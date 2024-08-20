import { ExplorerPane } from "../ExplorerPane";
import { memo, useState } from "react";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { Box, Button, Group, Text } from "@mantine/core";
import { DisconnectedEvent } from "~/util/global-events";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { Icon } from "~/components/Icon";
import { iconDesigner, iconExplorer, iconOpen, iconPlus, iconTable } from "~/util/icons";
import { useInterfaceStore } from "~/stores/interface";
import { useViewEffect } from "~/hooks/view";
import { syncDatabaseSchema } from "~/util/schema";
import { Panel, PanelGroup } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { usePanelMinSize } from "~/hooks/panels";
import { Introduction } from "~/components/Introduction";
import { adapter } from "~/adapter";
import { useIsConnected } from "~/hooks/connection";
import { TablesPane } from "~/screens/database/components/TablesPane";
import { Exporter } from "../Exporter";
import { Importer } from "../Importer";
import { useDesigner } from "~/providers/Designer";
import { useIsLight } from "~/hooks/theme";

const TablesPaneLazy = memo(TablesPane);
const ExplorerPaneLazy = memo(ExplorerPane);

export function ExplorerView() {
	const isLight = useIsLight();
	const { openTableCreator } = useInterfaceStore.getState();
	const { design } = useDesigner();

	const [activeTable, setActiveTable] = useState<string>();
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [creatorTable, setCreatorTable] = useState<string>();

	const isConnected = useIsConnected();

	const openCreator = useStable((table?: string) => {
		setCreatorTable(table || activeTable);
		isCreatingHandle.open();
	});

	const buildContextMenu = useStable((table: string) => [
		{
			key: 'open',
			title: "View records",
			icon: <Icon path={iconTable} />,
			onClick: () => setActiveTable(table)
		},
		{
			key: 'design',
			title: "Open designer",
			icon: <Icon path={iconDesigner} />,
			onClick: () => design(table)
		},
		{
			key: 'new',
			title: "Create new record",
			icon: <Icon path={iconPlus} />,
			onClick: () => openCreator(table)
		}
	]);

	useEventSubscription(DisconnectedEvent, () => {
		isCreatingHandle.close();
		setActiveTable(undefined);
	});

	useIntent("explore-table", ({ table }) => {
		setActiveTable(table);
	});

	useViewEffect("explorer", () => {
		syncDatabaseSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box h="100%" ref={ref}>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					<Panel
						defaultSize={minSize}
						minSize={minSize}
						maxSize={35}
					>
						<TablesPaneLazy
							icon={iconExplorer}
							activeTable={activeTable}
							onTableSelect={setActiveTable}
							onTableContextMenu={buildContextMenu}
							extraSection={
								<>
									<Exporter />
									<Importer />
								</>
							}
						/>
					</Panel>
					<PanelDragger />
					<Panel minSize={minSize}>
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
									code: `
										-- Declare a new table
										DEFINE TABLE person;
										
										-- Fetch table records
										SELECT * FROM person;
									`
								}}
							>
								<Text>
									The explorer view provides an easy way to browse your tables and records without writing any queries.
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
										onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealdb/surrealql/statements/define/table")}
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
				table={creatorTable || ''}
				onClose={isCreatingHandle.close}
			/>
		</>
	);
}

export default ExplorerView;