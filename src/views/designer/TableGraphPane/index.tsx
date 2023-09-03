import { ActionIcon, Box, Button, Center, Group, Kbd, LoadingOverlay, Modal, Paper, Popover, Select, Stack, Text, Title } from "@mantine/core";
import { mdiAdjust, mdiCog, mdiDownload, mdiHelpCircle, mdiPlus, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { DesignerLayoutMode, DesignerNodeMode, TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { toBlob } from "html-to-image";
import { ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { NODE_TYPES, buildTableGraph as buildTableDiagram } from "./helpers";
import { useStable } from "~/hooks/stable";
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";
import { useLater } from "~/hooks/later";
import { useIsLight } from "~/hooks/theme";
import { showNotification } from "@mantine/notifications";
import { useIsConnected } from "~/hooks/connection";
import { TableCreator } from "~/components/TableCreator";
import { ModalTitle } from "~/components/ModalTitle";
import { useActiveTab } from "~/hooks/environment";
import { actions, store } from "~/store";
import { DESIGNER_LAYOUT_MODES, DESIGNER_NODE_MODES } from "~/constants";
import { updateConfig } from "~/util/helpers";
import { useDesignerConfig } from "./hooks";
import { TableGrid } from "./grid";

interface HelpTitleProps {
	isLight: boolean;
	children: React.ReactNode;
}

function HelpTitle({ isLight, children }: HelpTitleProps) {
	return (
		<Title order={2} size={14} color={isLight ? "light.7" : "light.1"} weight={600}>
			{children}
		</Title>
	);
}

export interface TableGraphPaneProps {
	active: TableDefinition | null;
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [isRendering, setIsRendering] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [showConfig, setShowConfig] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const ref = useRef<ElementRef<"div">>(null);
	const isOnline = useIsConnected();
	const activeTab = useActiveTab();
	const isLight = useIsLight();
	
	const { nodeMode, layoutMode } = useDesignerConfig(activeTab);

	useEffect(() => {
		const [nodes, edges] = buildTableDiagram(props.tables, props.active, nodeMode);

		setNodes(nodes);
		setEdges(edges);
	}, [props.tables, props.active, nodeMode]);

	const createSnapshot = useStable(async (filePath: string) => {
		const contents = await toBlob(ref.current!, { cacheBust: true });

		if (!contents) {
			return;
		}

		await writeBinaryFile(filePath, await contents.arrayBuffer());

		setIsRendering(false);

		showNotification({
			message: "Snapshot saved to disk",
		});
	});

	const scheduleSnapshot = useLater(createSnapshot);

	// TODO Move download logic to adapter
	const saveImage = useStable(async () => {
		const filePath = await save({
			title: "Save snapshot",
			defaultPath: "snapshot.png",
			filters: [
				{
					name: "Image",
					extensions: ["png", "jpg", "jpeg"],
				},
			],
		});

		if (!filePath) {
			return;
		}

		setIsRendering(true);
		scheduleSnapshot(filePath);
	});

	const openHelp = useStable(() => {
		setShowHelp(true);
	});

	const closeHelp = useStable(() => {
		setShowHelp(false);
	});

	const showBox = !isOnline || props.tables.length === 0;

	const openCreator = useStable(() => {
		setIsCreating(true);
	});

	const closeCreator = useStable(() => {
		setIsCreating(false);
	});

	const toggleConfig = useStable(() => {
		setShowConfig(v => !v);
	});

	const setNodeMode = useStable((mode: string) => {
		store.dispatch(
			actions.updateTab({
				id: activeTab?.id,
				designerNodeMode: mode as DesignerNodeMode,
			})
		);

		updateConfig();
	});

	const setLayoutMode = useStable((mode: string) => {
		store.dispatch(
			actions.updateTab({
				id: activeTab?.id,
				designerLayoutMode: mode as DesignerLayoutMode,
			})
		);

		updateConfig();
	});

	return (
		<Panel
			title="Table Graph"
			icon={mdiAdjust}
			rightSection={
				<Group noWrap>
					<ActionIcon title="Create table..." onClick={openCreator}>
						<Icon color="light.4" path={mdiPlus} />
					</ActionIcon>
					<ActionIcon title="Refresh" onClick={fetchDatabaseSchema}>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
					<Popover
						opened={showConfig}
						onChange={setShowConfig}
						position="bottom-end"
						offset={{ crossAxis: -4, mainAxis: 8 }}
						withArrow
						withinPortal
						shadow="xl"
					>
						<Popover.Target>
							<ActionIcon
								title="Graph Options"
								onClick={toggleConfig}
							>
								<Icon color="light.4" path={mdiCog} />
							</ActionIcon>
						</Popover.Target>
						<Popover.Dropdown onMouseLeave={toggleConfig}>
							<Stack pb="xs">
								<ModalTitle>
									Table graph options
								</ModalTitle>
								<Select
									label="Table layout"
									data={DESIGNER_LAYOUT_MODES}
									value={layoutMode}
									onChange={setLayoutMode}
								/>

								<Select
									label="Table appearance"
									data={DESIGNER_NODE_MODES}
									value={nodeMode}
									onChange={setNodeMode}
								/>

								<Button
									color="surreal"
									fullWidth
									size="xs"
									onClick={saveImage}
								>
									Save snapshot
									<Icon
										right
										path={mdiDownload}
									/>
								</Button>
							</Stack>
						</Popover.Dropdown>
					</Popover>
					<ActionIcon title="Help" onClick={openHelp}>
						<Icon color="light.4" path={mdiHelpCircle} />
					</ActionIcon>
				</Group>
			}>
			<div style={{ width: "100%", height: "100%" }}>
				{showBox && (
					<Center h="100%" pos="absolute" inset={0} style={{ zIndex: 1 }}>
						<Paper py="md" px="xl" c="light.5" bg={isLight ? "light.0" : "dark.8"} ta="center" maw={400}>
							{isOnline ? (
								<>
									No tables found
									<Box mt={4} c="surreal" style={{ cursor: "pointer" }} onClick={openCreator}>
										Click here to create a new table
									</Box>
								</>
							) : (
								"Not connected to database"
							)}
						</Paper>
					</Center>
				)}

				<LoadingOverlay
					visible={isRendering}
					overlayBlur={4}
					overlayColor={isLight ? "white" : "dark.7"}
				/>
				
				{layoutMode == 'diagram' ? (
					<ReactFlow
						ref={ref}
						nodeTypes={NODE_TYPES}
						nodes={nodes}
						edges={edges}
						nodesDraggable={false}
						nodesConnectable={false}
						edgesFocusable={false}
						proOptions={{ hideAttribution: true }}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						onNodeClick={(_ev, node) => {
							props.setActiveTable(node.id);
						}}
					/>
				) : (
					<TableGrid
						ref={ref}
						tables={props.tables}
						active={props.active}
						nodeMode={nodeMode}
						onSelectTable={(table) => {
							props.setActiveTable(table.schema.name);
						}}
					/>
				)}
			</div>

			<Modal
				opened={showHelp}
				onClose={closeHelp}
				trapFocus={false}
				size="lg"
				title={<ModalTitle>Using the Table Graph</ModalTitle>}
			>
				<Text color={isLight ? "light.7" : "light.3"}>
					<HelpTitle isLight={isLight}>How do I use the table graph?</HelpTitle>

					<Text mt={8} mb="xl">
						The table graph will automatically render based on the tables in your database. You can click on a table to
						view its details and modify it's schema. Changes made to the schema will be reflected in the graph.
					</Text>

					<HelpTitle isLight={isLight}>Why are edges missing?</HelpTitle>

					<Text mt={8} mb="xl">
						Surrealist dermines edges by searching for correctly configured <Kbd>in</Kbd> and <Kbd>out</Kbd> fields. You
						can automatically create a new edge table by pressing the <Icon path={mdiPlus} /> button on the Table Graph
						panel. Keep in mind edges are only visible when the layout is set to <Text inline weight={600}>Diagram</Text>.
					</Text>

					<HelpTitle isLight={isLight}>Can I save the graph as an image?</HelpTitle>

					<Text mt={8}>
						Press the save snapshot button in the options dropdown to save the current graph as a PNG
						image. This snapshot will use your current theme, position, and scale.
					</Text>
				</Text>
			</Modal>

			<TableCreator opened={isCreating} onClose={closeCreator} />
		</Panel>
	);
}
