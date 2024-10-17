import classes from "./style.module.scss";

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Checkbox,
	Divider,
	Group,
	HoverCard,
	Loader,
	Popover,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import {
	type ChangeEvent,
	type ElementRef,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import {
	Background,
	type NodeChange,
	ReactFlow,
	useEdgesState,
	useNodesState,
	useReactFlow,
} from "reactflow";

import {
	iconAPI,
	iconChevronLeft,
	iconChevronRight,
	iconCog,
	iconFullscreen,
	iconHelp,
	iconImage,
	iconPlus,
	iconRefresh,
	iconRelation,
} from "~/util/icons";

import {
	EDGE_TYPES,
	type GraphWarning,
	NODE_TYPES,
	applyNodeLayout,
	buildFlowNodes,
	createSnapshot,
} from "./helpers";

import { useContextMenu } from "mantine-contextmenu";
import { sleep } from "radash";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { ContentPane } from "~/components/Pane";
import { RadioSelect } from "~/components/RadioSelect";
import { DESIGNER_DIRECTIONS, DESIGNER_NODE_MODES } from "~/constants";
import { useIsConnected } from "~/hooks/connection";
import { useActiveConnection } from "~/hooks/connection";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import type { DiagramDirection, DiagramMode, TableInfo } from "~/types";
import { getSetting } from "~/util/config";
import { showInfo } from "~/util/helpers";
import { themeColor } from "~/util/mantine";
import { GraphWarningLine } from "./components";

export interface TableGraphPaneProps {
	active: string | null;
	tables: TableInfo[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const { openTableCreator } = useInterfaceStore.getState();
	const { updateCurrentConnection } = useConfigStore.getState();
	const { showContextMenu } = useContextMenu();

	const schema = useDatabaseSchema();
	const isConnected = useIsConnected();
	const connection = useActiveConnection();
	const isViewActive = useConfigStore((s) => s.activeView === "designer");

	const [isComputing, setIsComputing] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const ref = useRef<ElementRef<"div">>(null);
	const activeSession = useActiveConnection();
	const isLight = useIsLight();

	const { fitView, getViewport, setViewport } = useReactFlow();
	const [warnings, setWarnings] = useState<GraphWarning[]>([]);
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
			const dimNodes = changes.flatMap((change) => {
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
				handleOnNodesChange(layoutChanges[0]);

				setEdges((prev) => {
					return prev.map((curr) => {
						const found = layoutChanges[1].find((edge) => edge.id === curr.id);

						if (!found) {
							return curr;
						}

						return {
							...curr,
							data: {
								...curr.data,
								elkData: {
									bendSections: found.bendSections,
									isDragged: false,
								}
							}
						};
					})
				});
				fitView();
			}
		}

		const lineStyle = getSetting("appearance", "lineStyle");

		if (lineStyle !== "metro") {
			return;
		}

		const uniqueChanges = new Set<string>();

		for (const change of changes) {
			if (change.type === "position") {
				const node = nodes.find(({ id }) => id === change.id);

				if (!node) {
					continue;
				}

				const edgesToChange = edges.filter(({ target, source }) => target === node.id || source === node.id).map(({ id }) => id);

				for (const edge of edgesToChange) {
					uniqueChanges.add(edge);
				}
			}
		}

		if (uniqueChanges.size === 0) {
			return;
		}

		setEdges((prev) => prev.map((edge) => {
			if (!uniqueChanges.has(edge.id)) {
				return edge;
			}

			return {
				...edge,
				data: {
					...edge.data,
					elkData: edge.data.elkData ? {
						...edge.data.elkData,
						isDragged: true,
					} : undefined,
				},
			}
		}));
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Fit view when nodes change
	useEffect(() => {
		if (doFitRef.current) {
			doFitRef.current = false;
			fitView();
		}
	}, [nodes]);

	const renderGraph = useStable(async () => {
		const [nodes, edges, warnings] = buildFlowNodes(
			props.tables,
			activeSession.diagramShowLinks,
		);

		setWarnings(warnings);

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

	const saveImage = useStable(async (type: "png" | "svg") => {
		const viewport = getViewport();

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

				return await createSnapshot(ref.current, type);
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

	const toggleTableList = useStable(() => {
		updateCurrentConnection({
			designerTableList: !connection.designerTableList,
		});
	});

	const showBox = !isComputing && (!isConnected || props.tables.length === 0);

	const setDiagramMode = useStable((mode: string) => {
		updateCurrentConnection({
			id: activeSession?.id,
			diagramMode: mode as DiagramMode,
		});
	});

	const setDiagramDirection = useStable((mode: string) => {
		updateCurrentConnection({
			id: activeSession?.id,
			diagramDirection: mode as DiagramDirection,
		});
	});

	const setDiagramShowLinks = useStable((e: ChangeEvent<HTMLInputElement>) => {
		updateCurrentConnection({
			id: activeSession?.id,
			diagramShowLinks: e.target.checked,
		});
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Render on settings change
	useEffect(() => {
		renderGraph();
	}, [activeSession.diagramMode, activeSession.diagramDirection, activeSession.diagramShowLinks]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Render on schema change
	useLayoutEffect(() => {
		if (isViewActive && isConnected) {
			renderGraph();
			return;
		}

		if (!isConnected) {
			setNodes([]);
			setEdges([]);
		}
	}, [schema, isViewActive, isConnected, activeSession.diagramDirection]);

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

	return (
		<ContentPane
			title="Table Graph"
			icon={iconRelation}
			style={{ overflow: "hidden" }}
			leftSection={
				<Tooltip label="Toggle table list">
					<ActionIcon
						mr="sm"
						color="slate"
						variant="light"
						onClick={toggleTableList}
						aria-label="Toggle table list"
					>
						<Icon
							path={connection.designerTableList ? iconChevronLeft : iconChevronRight}
						/>
					</ActionIcon>
				</Tooltip>
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
								<ActionIcon aria-label="Expand graph options">
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
								<Divider />
								<Checkbox
									label="Show record links"
									checked={activeSession.diagramShowLinks}
									onChange={setDiagramShowLinks}
								/>
							</Stack>
						</Popover.Dropdown>
					</Popover>
					<Tooltip label="Designer help">
						<Link href="https://surrealdb.com/docs/surrealist/concepts/designing-the-database-schema">
							<ActionIcon aria-label="Open designer help">
								<Icon path={iconHelp} />
							</ActionIcon>
						</Link>
					</Tooltip>
				</Group>
			}
		>
			<div style={{ position: "relative", width: "100%", height: "100%" }}>
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
					style={{ opacity: computing ? 0 : 1 }}
					onNodeClick={(_ev, node) => {
						props.setActiveTable(node.id);
					}}
					onContextMenu={showContextMenu([
						{
							key: "create",
							icon: <Icon path={iconPlus} />,
							title: "Create table...",
							onClick: openTableCreator,
						},
						{
							key: "view",
							icon: <Icon path={iconFullscreen} />,
							title: "Fit viewport",
							onClick: () => fitView(),
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
					<Background color={themeColor(isLight ? "slate.2" : "slate.6")} />
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
								fz="xl"
								fw={600}
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
			</div>
		</ContentPane>
	);
}
