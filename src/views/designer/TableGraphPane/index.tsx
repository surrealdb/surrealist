import "reactflow/dist/style.css";
import { ActionIcon, Box, Center, Group, Kbd, LoadingOverlay, Modal, Paper, Text, Title } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiHelpCircle, mdiPlus, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { toBlob } from "html-to-image";
import { Background, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { NODE_TYPES, buildTableGraph } from "./helpers";
import { useStable } from "~/hooks/stable";
import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";
import { useLater } from "~/hooks/later";
import { useIsLight } from "~/hooks/theme";
import { showNotification } from "@mantine/notifications";
import { useIsConnected } from "~/hooks/connection";
import { TableCreator } from "~/components/TableCreator";
import { ModalTitle } from "~/components/ModalTitle";

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
	const [showBackground, setShowBackground] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [showHelp, setShowHelp] = useState(false);
	const ref = useRef<ElementRef<"div">>(null);
	const isOnline = useIsConnected();
	const isLight = useIsLight();

	useEffect(() => {
		const [nodes, edges] = buildTableGraph(props.tables, props.active);

		setNodes(nodes);
		setEdges(edges);
	}, [props.tables, props.active]);

	const createSnapshot = useStable(async (filePath: string) => {
		const contents = await toBlob(ref.current!, { cacheBust: true });

		if (!contents) {
			return;
		}

		await writeBinaryFile(filePath, await contents.arrayBuffer());

		setShowBackground(true);

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

		setShowBackground(false);
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
					<ActionIcon title="Save as image" onClick={saveImage}>
						<Icon color="light.4" path={mdiDownload} />
					</ActionIcon>
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

				<LoadingOverlay visible={!showBackground} overlayBlur={4} overlayColor={isLight ? "white" : "dark.7"} />
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
					}}>
					{showBackground && <Background />}
				</ReactFlow>
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
						panel.
					</Text>

					<HelpTitle isLight={isLight}>Can I save the graph as an image?</HelpTitle>

					<Text mt={8}>
						Press the <Icon path={mdiDownload} /> button on the Table Graph panel to save the current graph as a PNG
						image. This snapshot will use your current theme, position, and scale.
					</Text>
				</Text>
			</Modal>

			<TableCreator opened={isCreating} onClose={closeCreator} />
		</Panel>
	);
}
