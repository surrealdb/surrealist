import classes from "./style.module.scss";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { ActionIcon, Box, Button, Group, Kbd, Loader, Modal, Popover, Stack, Text, Title, Tooltip } from "@mantine/core";
import { Background, NodeChange, ReactFlow, useEdgesState, useNodesState, useReactFlow } from "reactflow";
import { ElementRef, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NODE_TYPES, applyNodeLayout, buildFlowNodes, createSnapshot } from "./helpers";
import { DiagramDirection, DiagramMode, TableInfo } from "~/types";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useIsConnected } from "~/hooks/connection";
import { ModalTitle } from "~/components/ModalTitle";
import { useActiveConnection } from "~/hooks/connection";
import { DESIGNER_DIRECTIONS, DESIGNER_NODE_MODES } from "~/constants";
import { RadioSelect } from "~/components/RadioSelect";
import { adapter } from "~/adapter";
import { sleep } from "radash";
import { useConfigStore } from "~/stores/config";
import { themeColor } from "~/util/mantine";
import { useSchema } from "~/hooks/schema";
import { useContextMenu } from "mantine-contextmenu";
import { useBoolean } from "~/hooks/boolean";
import { iconAPI, iconCog, iconDesigner, iconFullscreen, iconHelp, iconImage, iconPlus, iconRefresh } from "~/util/icons";
import { useInterfaceStore } from "~/stores/interface";
import { showInfo } from "~/util/helpers";

interface HelpTitleProps {
	isLight: boolean;
	children: React.ReactNode;
}

function HelpTitle({ isLight, children }: HelpTitleProps) {
	return (
		<Title order={2} size={14} c={isLight ? "slate.9" : "white"} fw={600}>
			{children}
		</Title>
	);
}

export interface TableGraphPaneProps {
	active: TableInfo | null;
	tables: TableInfo[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const { openTableCreator } = useInterfaceStore.getState();
	const { updateCurrentConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const schema = useSchema();
	const isConnected = useIsConnected();
	const isViewActive = useConfigStore((s) => s.activeView == "designer");

	const [isComputing, setIsComputing] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [showHelp, showHelpHandle] = useBoolean();
	const ref = useRef<ElementRef<"div">>(null);
	const activeSession = useActiveConnection();
	const isLight = useIsLight();

	const { fitView, getViewport, setViewport } = useReactFlow();
	const [nodes, setNodes, handleOnNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [computing, setComputing] = useState(false);

	const doLayoutRef = useRef(false);
	const doFitRef = useRef(false);

	const onNodesChange = useStable(async (changes: NodeChange[]) => {
		handleOnNodesChange(changes);

		if (doLayoutRef.current) {
			doLayoutRef.current = false;

			const direction = activeSession.diagramDirection;
			const dimNodes = changes.flatMap(change => {
				if (change.type !== "dimensions" || !change.dimensions) {
					return [];
				}

				return {
					id: change.id,
					width: change.dimensions.width,
					height: change.dimensions.height,
				};
			});

			const layoutChanges = await applyNodeLayout(dimNodes, edges, direction);

			setComputing(false);

			if (changes.length > 0) {
				doFitRef.current = true;
				handleOnNodesChange(layoutChanges);
				fitView();
			}
		}
	});

	useEffect(() => {
		if (doFitRef.current) {
			doFitRef.current = false;
			fitView();
		}
	}, [nodes]);

	const renderGraph = useStable(async () => {
		const [nodes, edges] = buildFlowNodes(props.tables);

		if (nodes.length === 0) {
			setNodes([]);
			setEdges([]);
			setIsComputing(false);
			return;
		}

		setNodes(nodes);
		setEdges(edges);
		setComputing(true);

		doLayoutRef.current = true;
	});

	const saveImage = useStable(async (type: 'png' | 'svg') => {
		const viewport = getViewport();

		const isSuccess = await adapter.saveFile("Save snapshot", `snapshot.${type}`, [
			{
				name: "Image",
				extensions: [type],
			},
		], async () => {
			setIsExporting(true);

			await sleep(50);

			fitView();

			return await createSnapshot(ref.current!, type);
		});

		setIsExporting(false);
		setViewport(viewport);

		if (isSuccess) {
			showInfo({
				title: "Designer",
				subtitle: "Snapshot saved to disk"
			});
		}
	});

	const showBox = !isComputing && (!isConnected || props.tables.length === 0);

	const setDiagramMode = useStable((mode: string) => {
		updateCurrentConnection({
			id: activeSession?.id,
			diagramMode: mode as DiagramMode,
		});

		renderGraph();
	});

	const setDiagramDirection = useStable((mode: string) => {
		updateCurrentConnection({
			id: activeSession?.id,
			diagramDirection: mode as DiagramDirection,
		});

		renderGraph();
	});

	useLayoutEffect(() => {
		if (isViewActive && isConnected) {
			renderGraph();
		} else if(!isConnected) {
			setNodes([]);
			setEdges([]);
		}
	}, [schema, isViewActive, isConnected, activeSession.diagramDirection]);

	useEffect(() => {
		setNodes(curr => {
			return curr.map(node => {
				return {
					...node,
					data: {
						...node.data,
						isSelected: node.id === props.active?.schema.name
					},
				};
			});
		});
	}, [props.active]);

	return (
		<ContentPane
			title="Table Graph"
			icon={iconDesigner}
			style={{ overflow: 'hidden' }}
			rightSection={
				<Group wrap="nowrap">
					<Tooltip label="New table">
						<ActionIcon
							onClick={openTableCreator}
							aria-label="Create new table"
							disabled={!isConnected}
						>
							<Icon path={iconPlus} />
						</ActionIcon>
					</Tooltip>
					<Popover
						position="bottom-end"
						offset={{ crossAxis: -4, mainAxis: 8 }}
						shadow="sm"
					>
						<Popover.Target>
							<Tooltip label="Graph Options">
								<ActionIcon
									aria-label="Expand graph options"
								>
									<Icon path={iconCog} />
								</ActionIcon>
							</Tooltip>
						</Popover.Target>
						<Popover.Dropdown>
							<Stack w={150}>
								<RadioSelect
									label="Table appearance"
									data={DESIGNER_NODE_MODES}
									value={activeSession.diagramMode}
									onChange={setDiagramMode}
								/>
								<RadioSelect
									label="Direction"
									data={DESIGNER_DIRECTIONS}
									value={activeSession.diagramDirection}
									onChange={setDiagramDirection}
								/>
							</Stack>
						</Popover.Dropdown>
					</Popover>
					<Tooltip label="Designer help">
						<ActionIcon
							onClick={showHelpHandle.open}
							aria-label="Open designer help"
						>
							<Icon path={iconHelp} />
						</ActionIcon>
					</Tooltip>
				</Group>
			}>
			<div style={{ position: "relative", width: "100%", height: "100%" }}>
				<ReactFlow
					ref={ref}
					fitView
					nodes={nodes}
					edges={edges}
					nodeTypes={NODE_TYPES}
					nodesConnectable={false}
					edgesFocusable={false}
					proOptions={{ hideAttribution: true }}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					className={classes.diagram}
					style={{ opacity: computing ? 0 : 1 }}
					onNodeClick={(_ev, node) => {
						props.setActiveTable(node.id);
					}}
					onContextMenu={showContextMenu([
						{
							key: 'create',
							icon: <Icon path={iconPlus} />,
							title: 'Create table...',
							onClick: openTableCreator
						},
						{
							key: 'view',
							icon: <Icon path={iconFullscreen} />,
							title: 'Fit viewport',
							onClick: () => fitView()
						},
						{
							key: 'refresh',
							icon: <Icon path={iconRefresh} />,
							title: 'Reset graph',
							onClick: renderGraph
						},
						{ key: 'divider' },
						{
							key: 'download-png',
							icon: <Icon path={iconImage} />,
							title: 'Export as PNG',
							onClick: () => saveImage('png')
						},
						{
							key: 'download-svg',
							icon: <Icon path={iconAPI} />,
							title: 'Export as SVG',
							onClick: () => saveImage('svg')
						},
					])}
				>
					<Background
						color={themeColor(isLight ? "slate.2": "slate.6")}
					/>
				</ReactFlow>

				{isExporting && (
					<Stack
						inset={0}
						pos="absolute"
						align="center"
						justify="center"
						bg="var(--mantine-color-body)"
						style={{ zIndex: 5 }}
					>
						<Loader />
						<Text fz="xl" fw={600}>
							Exporting graph...
						</Text>
					</Stack>
				)}

				{showBox && (
					<Stack
						inset={0}
						pos="absolute"
						align="center"
						justify="center"
						gap="xl"
					>
						<Box ta="center">
							<Text fz="xl" fw={600}>
								No tables defined
							</Text>
							<Text>
								Define tables to visualize them in the table graph
							</Text>
						</Box>
						<Button
							variant="gradient"
							leftSection={<Icon path={iconPlus} />}
							disabled={!isConnected}
							onClick={openTableCreator}
						>
							Create table
						</Button>
					</Stack>
				)}
			</div>

			<Modal
				opened={showHelp}
				onClose={showHelpHandle.close}
				trapFocus={false}
				size="lg"
				withCloseButton
				title={<ModalTitle>Using the Table Graph</ModalTitle>}
			>
				<Text c={isLight ? "slate.7" : "slate.2"}>
					<HelpTitle isLight={isLight}>How do I use the table graph?</HelpTitle>

					<Text mt={8} mb="xl">
						The table graph will automatically render based on the tables in your database. You can click on a table to
						view its details and modify it's schema. Changes made to the schema will be reflected in the graph.
					</Text>

					<HelpTitle isLight={isLight}>Can I change how tables are displayed?</HelpTitle>

					<Text mt={8} mb="xl">
						Press the <Icon path={iconCog} size="sm" /> button in the top right corner to open the graph options. Inside you
						can change the table layout and table appearance. These settings are saved per session, however you can configure
						default values in the Surrealist settings.
					</Text>

					<HelpTitle isLight={isLight}>Why are edges missing?</HelpTitle>

					<Text mt={8} mb="xl">
						Surrealist dermines edges by searching for correctly configured <Kbd>in</Kbd> and <Kbd>out</Kbd> fields. You
						can automatically create a new edge table by pressing the <Icon path={iconPlus} /> button on the Table Graph
						panel. Keep in mind edges are only visible when the layout is set to Diagram.
					</Text>

					<HelpTitle isLight={isLight}>Can I save the graph as an image?</HelpTitle>

					<Text mt={8}>
						Press the save snapshot button in the options dropdown to save the current graph as a PNG
						image. This snapshot will use your current theme, position, and scale.
					</Text>
				</Text>
			</Modal>
		</ContentPane>
	);
}
