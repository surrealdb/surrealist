import { Box, Button, Group } from "@mantine/core";
import { Text } from "@mantine/core";
import { ReactFlowProvider } from "@xyflow/react";
import { memo, useEffect } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Introduction } from "~/components/Introduction";
import { PanelDragger } from "~/components/Pane/dragger";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { useIntent, useViewFocus } from "~/hooks/routing";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useDesigner } from "~/providers/Designer";
import { TablesPane } from "~/screens/surrealist/components/TablesPane";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { iconDesigner, iconEye, iconOpen, iconPlus } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { syncConnectionSchema } from "~/util/schema";
import { TableGraphPane } from "../TableGraphPane";

const TableGraphPaneLazy = memo(TableGraphPane);

export function DesignerView() {
	const { openTableCreator } = useInterfaceStore.getState();
	const { updateCurrentConnection } = useConfigStore.getState();
	const { design, stopDesign, active, isDesigning } = useDesigner();
	const designerTableList = useConnection((c) => c?.designerTableList);

	const isConnected = useIsConnected();
	const tables = useTables();

	const buildContextMenu = useStable((table: string) => [
		{
			key: "open",
			title: "Open designer",
			icon: <Icon path={iconDesigner} />,
			onClick: () => design(table),
		},
		{
			key: "open",
			title: "Focus table",
			icon: <Icon path={iconEye} />,
			onClick: () => dispatchIntent("focus-table", { table }),
		},
	]);

	const closeTableList = useStable(() => {
		updateCurrentConnection({
			designerTableList: false,
		});
	});

	useEffect(() => {
		if (!isConnected) {
			stopDesign();
		}
	}, [isConnected, stopDesign]);

	useIntent("design-table", ({ table }) => {
		design(table);
	});

	useViewFocus("designer", () => {
		syncConnectionSchema();
	});

	const emptySchema = tables.length === 0;
	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box
				h="100%"
				ref={ref}
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					{(designerTableList || emptySchema) && (
						<>
							<Panel
								defaultSize={minSize}
								minSize={minSize}
								maxSize={35}
								id="tables"
								order={1}
							>
								<TablesPane
									icon={iconDesigner}
									closeDisabled={emptySchema}
									onTableSelect={design}
									onTableContextMenu={buildContextMenu}
									onClose={closeTableList}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel
						minSize={minSize}
						id="graph"
						order={2}
					>
						{tables.length > 0 ? (
							<ReactFlowProvider>
								<TableGraphPaneLazy
									tables={tables}
									active={isDesigning ? active : null}
									setActiveTable={design}
								/>
							</ReactFlowProvider>
						) : (
							<Introduction
								title="Designer"
								icon={iconDesigner}
								snippet={{
									language: "surrealql",
									title: "SurrealQL",
									code: `
										-- Declare a new table
										DEFINE TABLE person;
										
										-- Define a table field
										DEFINE FIELD name ON person TYPE string;

										-- Define an index on the field
										DEFINE INDEX unique_name ON person
											FIELDS name UNIQUE;
									`,
								}}
							>
								<Text>
									The designer view allows you to visually design your database
									schema without writing queries.
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
												"https://surrealdb.com/docs/surrealdb/surrealql/statements/define/table",
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
		</>
	);
}

export default DesignerView;
