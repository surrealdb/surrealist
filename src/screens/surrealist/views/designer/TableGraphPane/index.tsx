import {
	Badge,
	Box,
	Button,
	Group,
	HoverCard,
	Loader,
	Paper,
	Popover,
	Select,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import {
	Background,
	type Edge,
	getNodesBounds,
	type Node,
	ReactFlow,
	useEdgesState,
	useNodesInitialized,
	useNodesState,
	useReactFlow,
} from "@xyflow/react";
import { useContextMenu } from "mantine-contextmenu";
import { sleep } from "radash";
import {
	type ElementRef,
	type MouseEvent,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Link } from "~/components/Link";
import { ContentPane } from "~/components/Pane";
import {
	DESIGNER_ALGORITHMS,
	DESIGNER_DIRECTIONS,
	DESIGNER_HOVER_FOCUS,
	DESIGNER_LINE_STYLES,
	DESIGNER_LINKS,
	DESIGNER_NODE_MODES,
} from "~/constants";
import { useSetting } from "~/hooks/config";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useConnectionAndView, useIntent } from "~/hooks/routing";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { DiagramContext } from "~/screens/surrealist/views/designer/TableGraphPane/nodes/BaseTableNode";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type {
	DiagramAlgorithm,
	DiagramDirection,
	DiagramHoverFocus,
	DiagramLineStyle,
	DiagramLinks,
	DiagramMode,
	TableInfo,
} from "~/types";
import { showInfo } from "~/util/helpers";
import {
	iconAPI,
	iconChevronRight,
	iconCog,
	iconFullscreen,
	iconHelp,
	iconImage,
	iconMagnifyMinus,
	iconMagnifyPlus,
	iconPlus,
	iconRefresh,
	iconRelation,
	iconReset,
} from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { GraphWarningLine } from "./components";
import {
	applyDefault,
	applyNodeLayout,
	buildFlowNodes,
	createSnapshot,
	EDGE_TYPES,
	type GraphWarning,
	NODE_TYPES,
} from "./helpers";
import classes from "./style.module.scss";

export interface TableGraphPaneProps {
	active: string | null;
	tables: TableInfo[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const { openTableCreator } = useInterfaceStore.getState();
	const { updateConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const schema = useDatabaseSchema();
	const isConnected = useIsConnected();
	const [, view] = useConnectionAndView();

	const [
		connectionId,
		designerTableList,
		diagramAlgorithm,
		diagramDirection,
		diagramLineStyle,
		diagramLinkMode,
		diagramMode,
		diagramHoverFocus,
	] = useConnection((c) => [
		c?.id ?? "",
		c?.designerTableList,
		c?.diagramAlgorithm,
		c?.diagramDirection,
		c?.diagramLineStyle,
		c?.diagramLinkMode,
		c?.diagramMode,
		c?.diagramHoverFocus,
	]);

	const [isExporting, setIsExporting] = useState(false);
	const ref = useRef<ElementRef<"div">>(null);
	const isLight = useIsLight();

	const { fitView, zoomIn, zoomOut, getViewport, setViewport } = useReactFlow();
	const [warnings, setWarnings] = useState<GraphWarning[]>([]);
	const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
	const [rendering, setRendering] = useState(false);

	const { getNodes, getEdges } = useReactFlow();
	const nodesInitialized = useNodesInitialized({ includeHiddenNodes: true });
	const isLayedOut = useRef(false);

	const [hoveredNode, setHoveredNode] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const [defaultAlgorithm] = useSetting("appearance", "defaultDiagramAlgorithm");
	const [defaultDirection] = useSetting("appearance", "defaultDiagramDirection");
	const [defaultLineStyle] = useSetting("appearance", "defaultDiagramLineStyle");
	const [defaultLinkMode] = useSetting("appearance", "defaultDiagramLinkMode");
	const [defaultNodeMode] = useSetting("appearance", "defaultDiagramMode");
	const [defaultHoverFocus] = useSetting("appearance", "defaultDiagramHoverFocus");

	const algorithm = applyDefault(diagramAlgorithm, defaultAlgorithm);
	const direction = applyDefault(diagramDirection, defaultDirection);
	const lineStyle = applyDefault(diagramLineStyle, defaultLineStyle);
	const linkMode = applyDefault(diagramLinkMode, defaultLinkMode);
	const nodeMode = applyDefault(diagramMode, defaultNodeMode);
	const hoverFocus = applyDefault(diagramHoverFocus, defaultHoverFocus);

	useLayoutEffect(() => {
		if (isLayedOut.current || !nodesInitialized) {
			return;
		}

		isLayedOut.current = true;

		applyNodeLayout(getNodes(), getEdges(), algorithm, direction)
			.then(([nodes, edges]) => {
				onNodesChange(nodes);
				onEdgesChange(edges);
				setTimeout(fitView, 0);
			})
			.finally(() => {
				setRendering(false);
			});
	}, [nodesInitialized, algorithm, direction]);

	const renderGraph = useStable(async () => {
		const [nodes, edges, warnings] = await buildFlowNodes(
			props.tables,
			nodeMode,
			direction,
			linkMode,
			lineStyle,
		);

		setWarnings(warnings);

		if (nodes.length === 0) {
			setNodes([]);
			setEdges([]);
			setRendering(false);
			return;
		}

		isLayedOut.current = false;
		setRendering(true);
		setNodes(nodes);
		setEdges(edges);
	});

	const handleNodeClick = useStable((_: MouseEvent, node: Node) => {
		props.setActiveTable(node.id);
	});

	const handleNodeDragStart = useStable((_: MouseEvent, node: Node) => {
		setEdges((edges) =>
			edges.map((edge) => {
				const isDisrupted = edge.source === node.id || edge.target === node.id;

				return {
					...edge,
					data: {
						...edge.data,
						isDragged: isDisrupted ? true : (edge.data?.isDragged ?? false),
					},
				};
			}),
		);

		setIsDragging(true);
	});

	const handleNodeDragStop = useStable(() => {
		setIsDragging(false);
	});

	const handleNodeMouseEnter = useStable((_: MouseEvent, node: Node) => {
		if (hoverFocus === "neighbours" || hoverFocus === "chain" || hoverFocus === "recursive") {
			setHoveredNode(node.id);
		}
	});

	const handleNodeMouseLeave = useStable(() => {
		if (hoverFocus === "neighbours" || hoverFocus === "chain" || hoverFocus === "recursive") {
			setHoveredNode(null);
		}
	});

	const saveImage = useStable(async (type: "png" | "svg") => {
		const viewport = getViewport();
		const nodesBounds = getNodesBounds(getNodes());

		const isSuccess = await adapter.saveFile(
			"Save snapshot",
			`snapshot.${type}`,
			[
				{
					name: "Image",
					extensions: [type],
				},
			],
			async () => {
				if (!ref.current) return "";

				setIsExporting(true);

				await sleep(50);

				fitView();

				// Reactflow expects to use the viewport element for snapshotting.
				const el = ref.current.querySelector<HTMLDivElement>(".react-flow__viewport");

				if (!el) {
					console.error(
						"Failed to find the XYFlow viewport element for snapshotting",
						ref.current,
					);
					return "";
				}

				return await createSnapshot(el, type, nodesBounds);
			},
		);

		setIsExporting(false);
		setViewport(viewport);

		if (isSuccess) {
			showInfo({
				title: "Designer",
				subtitle: "Snapshot saved to disk",
			});
		}
	});

	const openTableList = useStable(() => {
		updateConnection({
			id: connectionId,
			designerTableList: true,
		});
	});

	const showBox = !isConnected || props.tables.length === 0;

	const setDiagramAlgorithm = useStable((alg: string) => {
		updateConnection({
			id: connectionId,
			diagramAlgorithm: alg as DiagramAlgorithm,
		});
	});

	const setDiagramDirection = useStable((mode: string) => {
		updateConnection({
			id: connectionId,
			diagramDirection: mode as DiagramDirection,
		});
	});

	const setDiagramLineStyle = useStable((style: string) => {
		updateConnection({
			id: connectionId,
			diagramLineStyle: style as DiagramLineStyle,
		});
	});

	const setDiagramLinkMode = useStable((mode: string) => {
		updateConnection({
			id: connectionId,
			diagramLinkMode: mode as DiagramLinks,
		});
	});

	const setDiagramMode = useStable((mode: string) => {
		updateConnection({
			id: connectionId,
			diagramMode: mode as DiagramMode,
		});
	});

	const setDiagramHoverFocus = useStable((mode: string) => {
		updateConnection({
			id: connectionId,
			diagramHoverFocus: mode as DiagramHoverFocus,
		});
	});

	const handleZoomIn = useStable(() => {
		zoomIn({ duration: 150 });
	});

	const handleZoomOut = useStable(() => {
		zoomOut({ duration: 150 });
	});

	const handleResetZoom = useStable(() => {
		fitView({ duration: 150 });
	});

	const isViewActive = view === "designer";

	// biome-ignore lint/correctness/useExhaustiveDependencies: Render on schema or setting change
	useLayoutEffect(() => {
		if (isViewActive && isConnected) {
			renderGraph();
			return;
		}

		if (!isConnected) {
			setNodes([]);
			setEdges([]);
		}
	}, [schema, isViewActive, isConnected, algorithm, direction, lineStyle, linkMode, nodeMode]);

	useEffect(() => {
		setNodes((curr) => {
			return curr.map((node) => {
				return {
					...node,
					data: {
						...node.data,
						isSelected: node.id === props.active,
					},
				};
			});
		});
	}, [props.active]);

	useEffect(() => {
		const shouldApplyDimming =
			(hoverFocus === "neighbours" || hoverFocus === "chain" || hoverFocus === "recursive") &&
			hoveredNode !== null &&
			!isDragging;

		if (!shouldApplyDimming) {
			setNodes((nodes) =>
				nodes.map((node) => ({
					...node,
					className: node.className
						? node.className
								.split(" ")
								.filter((c) => c !== "dimmed")
								.join(" ")
						: undefined,
				})),
			);

			setEdges((edges) =>
				edges.map((edge) => ({
					...edge,
					className: edge.className
						? edge.className
								.split(" ")
								.filter((c) => c !== "dimmed")
								.join(" ")
						: edge.type === "elk"
							? "record-link"
							: undefined,
				})),
			);

			return;
		}

		const currentEdges = getEdges();
		const relatedNodes = new Set<string>([hoveredNode]);

		if (hoverFocus === "chain") {
			const traverseRelations = (
				nodeId: string,
				visited: Set<string>,
				isForward: boolean,
			) => {
				if (visited.has(nodeId)) return;

				visited.add(nodeId);
				relatedNodes.add(nodeId);

				for (const edge of currentEdges) {
					if (isForward && edge.source === nodeId && !visited.has(edge.target)) {
						traverseRelations(edge.target, visited, true);
					}
					if (!isForward && edge.target === nodeId && !visited.has(edge.source)) {
						traverseRelations(edge.source, visited, false);
					}
				}
			};

			traverseRelations(hoveredNode, new Set<string>(), true);
			traverseRelations(hoveredNode, new Set<string>(), false);
		} else if (hoverFocus === "recursive") {
			const traverseRelations = (nodeId: string, visited: Set<string>) => {
				if (visited.has(nodeId)) return;
				visited.add(nodeId);
				relatedNodes.add(nodeId);

				for (const edge of currentEdges) {
					if (edge.source === nodeId && !visited.has(edge.target)) {
						traverseRelations(edge.target, visited);
					}
					if (edge.target === nodeId && !visited.has(edge.source)) {
						traverseRelations(edge.source, visited);
					}
				}
			};
			traverseRelations(hoveredNode, new Set<string>());
		} else {
			for (const edge of currentEdges) {
				if (edge.source === hoveredNode) {
					relatedNodes.add(edge.target);
				}
				if (edge.target === hoveredNode) {
					relatedNodes.add(edge.source);
				}
			}
		}

		setNodes((nodes) =>
			nodes.map((node) => {
				const isRelated = relatedNodes.has(node.id);
				const classes = node.className
					? node.className.split(" ").filter((c) => c !== "dimmed")
					: [];

				if (!isRelated) {
					classes.push("dimmed");
				}

				return {
					...node,
					className: classes.length > 0 ? classes.join(" ") : undefined,
				};
			}),
		);

		setEdges((edges) =>
			edges.map((edge) => {
				const isRelated = relatedNodes.has(edge.source) && relatedNodes.has(edge.target);

				const baseClasses = edge.className
					? edge.className.split(" ").filter((c) => c !== "dimmed")
					: [];

				if (edge.type === "elk" && baseClasses.length === 0) {
					baseClasses.push("record-link");
				}

				if (!isRelated) {
					baseClasses.push("dimmed");
				}

				return {
					...edge,
					className: baseClasses.join(" "),
				};
			}),
		);
	}, [hoveredNode, hoverFocus, isDragging]);

	useIntent("focus-table", ({ table }) => {
		const node = getNodes().find((node) => node.id === table);

		if (node) {
			fitView({
				nodes: [node],
				duration: 300,
			});
		}
	});

	return (
		<DiagramContext.Provider value={{ warnings }}>
			<ContentPane
				title="Table Graph"
				icon={iconRelation}
				style={{ overflow: "hidden" }}
				withDivider={false}
				leftSection={
					!designerTableList && (
						<ActionButton
							label="Reveal tables"
							mr="sm"
							color="slate"
							variant="light"
							onClick={openTableList}
						>
							<Icon path={iconChevronRight} />
						</ActionButton>
					)
				}
				rightSection={
					<Group wrap="nowrap">
						{warnings.length > 0 && (
							<HoverCard position="bottom-end">
								<HoverCard.Target>
									<Badge
										variant="light"
										color="orange"
										h={26}
									>
										Encountered {warnings.length} warnings
									</Badge>
								</HoverCard.Target>
								<HoverCard.Dropdown>
									<Stack>
										{warnings.map((warning, i) => (
											<GraphWarningLine
												key={i}
												warning={warning}
											/>
										))}
									</Stack>
								</HoverCard.Dropdown>
							</HoverCard>
						)}
						<ActionButton
							label="New table"
							disabled={!isConnected}
							onClick={openTableCreator}
						>
							<Icon path={iconPlus} />
						</ActionButton>
						<Popover
							position="bottom-end"
							transitionProps={{ transition: "scale-y" }}
							offset={{ crossAxis: -4, mainAxis: 8 }}
							shadow="sm"
						>
							<Popover.Target>
								<div>
									<ActionButton label="Graph options">
										<Icon path={iconCog} />
									</ActionButton>
								</div>
							</Popover.Target>
							<Popover.Dropdown maw={325}>
								<Text
									c="bright"
									fw={500}
									fz={15}
								>
									Table graph settings
								</Text>
								<Text fz="sm">Local to this connection</Text>
								<SimpleGrid
									my="xl"
									cols={2}
									style={{ alignItems: "center" }}
									verticalSpacing="xs"
								>
									<Label>Line style</Label>
									<Select
										data={DESIGNER_LINE_STYLES}
										value={diagramLineStyle}
										onChange={setDiagramLineStyle as any}
										comboboxProps={{ withinPortal: false }}
									/>

									<Label>Algorithm</Label>
									<Select
										data={DESIGNER_ALGORITHMS}
										value={diagramAlgorithm}
										onChange={setDiagramAlgorithm as any}
										comboboxProps={{ withinPortal: false }}
									/>

									<Label>Appearance</Label>
									<Select
										data={DESIGNER_NODE_MODES}
										value={diagramMode}
										onChange={setDiagramMode as any}
										comboboxProps={{ withinPortal: false }}
									/>

									<Label>Direction</Label>
									<Select
										data={DESIGNER_DIRECTIONS}
										value={diagramDirection}
										onChange={setDiagramDirection as any}
										comboboxProps={{ withinPortal: false }}
									/>

									<Label>Record links</Label>
									<Select
										data={DESIGNER_LINKS}
										value={diagramLinkMode}
										onChange={setDiagramLinkMode as any}
										comboboxProps={{ withinPortal: false }}
									/>
									<Label>Hover focus</Label>
									<Select
										data={DESIGNER_HOVER_FOCUS}
										value={diagramHoverFocus}
										onChange={setDiagramHoverFocus as any}
										comboboxProps={{ withinPortal: false }}
									/>
								</SimpleGrid>
								<Text fz="sm">
									You can customise default values in the settings menu
								</Text>
							</Popover.Dropdown>
						</Popover>
						<Link href="https://surrealdb.com/docs/surrealist/concepts/designing-the-database-schema">
							<ActionButton label="Designer help">
								<Icon path={iconHelp} />
							</ActionButton>
						</Link>
					</Group>
				}
			>
				<Paper
					flex="1"
					pos="relative"
					bg={isLight ? "slate.1" : "slate.7"}
				>
					<ReactFlow
						ref={ref}
						fitView
						nodes={nodes}
						edges={edges}
						minZoom={0.1}
						nodeTypes={NODE_TYPES}
						edgeTypes={EDGE_TYPES}
						nodesConnectable={false}
						edgesFocusable={false}
						proOptions={{ hideAttribution: true }}
						onNodesChange={onNodesChange}
						onEdgesChange={onEdgesChange}
						className={classes.diagram}
						style={{
							opacity: rendering ? 0 : 1,
							transition: rendering ? undefined : "opacity .15s",
							contain: "content",
						}}
						onNodeClick={handleNodeClick}
						onNodeDragStart={handleNodeDragStart}
						onNodeDragStop={handleNodeDragStop}
						onNodeMouseEnter={handleNodeMouseEnter}
						onNodeMouseLeave={handleNodeMouseLeave}
						onContextMenu={showContextMenu([
							{
								key: "create",
								icon: <Icon path={iconPlus} />,
								title: "Create table",
								onClick: openTableCreator,
							},
							{
								key: "divider",
							},
							{
								key: "zoom-in",
								icon: <Icon path={iconMagnifyPlus} />,
								title: "Zoom in",
								onClick: handleZoomIn,
							},
							{
								key: "zoom-out",
								icon: <Icon path={iconMagnifyMinus} />,
								title: "Zoom out",
								onClick: handleZoomOut,
							},
							{
								key: "view",
								icon: <Icon path={iconFullscreen} />,
								title: "Fit viewport",
								onClick: handleResetZoom,
							},
							{
								key: "refresh",
								icon: <Icon path={iconRefresh} />,
								title: "Reset graph",
								onClick: renderGraph,
							},
							{ key: "divider" },
							{
								key: "download-png",
								icon: <Icon path={iconImage} />,
								title: "Export as PNG",
								onClick: () => saveImage("png"),
							},
							{
								key: "download-svg",
								icon: <Icon path={iconAPI} />,
								title: "Export as SVG",
								onClick: () => saveImage("svg"),
							},
						])}
					>
						{!showBox && (
							<Background color={themeColor(isLight ? "slate.3" : "slate.5")} />
						)}
					</ReactFlow>

					<Paper
						withBorder
						pos="absolute"
						right={12}
						top={12}
						shadow="sm"
						p="xs"
					>
						<Stack gap="xs">
							<ActionButton
								label="Zoom in"
								onClick={handleZoomIn}
							>
								<Icon path={iconMagnifyPlus} />
							</ActionButton>
							<ActionButton
								label="Zoom out"
								onClick={handleZoomOut}
							>
								<Icon path={iconMagnifyMinus} />
							</ActionButton>
							<ActionButton
								label="Fit viewport"
								onClick={handleResetZoom}
							>
								<Icon path={iconFullscreen} />
							</ActionButton>
							<ActionButton
								label="Reset graph"
								onClick={renderGraph}
							>
								<Icon path={iconReset} />
							</ActionButton>
						</Stack>
					</Paper>

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
							<Text
								fz="xl"
								fw={600}
							>
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
								<Text
									fz="lg"
									fw={600}
									c="bright"
								>
									No tables defined
								</Text>
								<Text>Define tables to visualize them in the table graph</Text>
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
				</Paper>
			</ContentPane>
		</DiagramContext.Provider>
	);
}
