import {
	iconMagnifyPlus,
	iconMagnifyMinus,
	iconFullscreen,
	iconImage,
	iconAPI,
	iconSearch,
	iconEyeOff,
	iconRelation,
	iconCopy,
	iconPlay,
	iconStop,
	iconReset,
} from "~/util/icons";

import { Box, BoxProps, ElementProps, Paper, Stack, useMantineTheme } from "@mantine/core";
import { createNodeBorderProgram } from "@sigma/node-border";
import Graph from "graphology";
import { ContextMenuDivider, ContextMenuItem, useContextMenu } from "mantine-contextmenu";
import { useRef, useEffect, MouseEvent } from "react";
import Sigma from "sigma";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { createEdgeCurveProgram } from "@sigma/edge-curve";
import { useStable } from "~/hooks/stable";
import { getIsLight, useIsLight } from "~/hooks/theme";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";
import { drawHover, drawLabel } from "./drawing";
import { useInspector } from "~/providers/Inspector";
import { RecordId } from "surrealdb";
import { NodeContextMenu } from "./context";

export interface RelationGraphNode extends Partial<NodeDisplayData> {
	record: RecordId;
}

export interface RelationGraphEdge extends Partial<EdgeDisplayData> {
	record: RecordId;
	weight: number;
}

export interface RelationGraphProps extends BoxProps, ElementProps<"div"> {
	graph: Graph<RelationGraphNode, RelationGraphEdge>;
	controlOffsetTop?: number;
	controlOffsetRight?: number;
	isSupervising?: boolean;
	hiddenNodes?: string[];
	hiddenEdges?: string[];
	hiddenTables?: string[];
	onChangeSupervising?: (supervisor: boolean) => void;
	onHideNode?: (node: string) => void;
	onReset?: () => void;
}

export function RelationGraph({
	graph,
	controlOffsetTop,
	controlOffsetRight,
	isSupervising,
	hiddenNodes,
	hiddenEdges,
	hiddenTables,
	onChangeSupervising,
	onHideNode,
	onReset,
	...other
}: RelationGraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigmaRef = useRef<Sigma | null>(null);
	const graphRef = useRef<Graph<RelationGraphNode, RelationGraphEdge>>(graph);
	const hiddenNodesRef = useRef<string[]>(hiddenNodes || []);
	const hiddenEdgesRef = useRef<string[]>(hiddenEdges || []);
	const hiddenTablesRef = useRef<string[]>(hiddenTables || []);
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const { showContextMenu } = useContextMenu();
	const { inspect } = useInspector();

	const focusRef = useRef({
		hoveredNode: "",
		neighbours: new Set<string>(),
	});

	const edgeColor = isLight ? theme.colors.slate[3] : theme.colors.slate[5];
	const nodeLabelColor = isLight ? theme.colors.slate[9] : theme.colors.slate[0];
	const edgeLabelColor = isLight ? theme.colors.slate[5] : theme.colors.slate[2];

	const handleZoomIn = useStable(() => {
		sigmaRef.current?.refresh();
		sigmaRef.current?.getCamera().animatedZoom();
	});

	const handleZoomOut = useStable(() => {
		sigmaRef.current?.refresh();
		sigmaRef.current?.getCamera().animatedUnzoom();
	});

	const handleResetZoom = useStable(() => {
		sigmaRef.current?.refresh();
		sigmaRef.current?.getCamera().animatedReset();
	});

	// Refresh the graph on data change
	useEffect(() => {
		const sigma = sigmaRef.current;

		graphRef.current = graph;

		if (sigma) {
			sigma.clear();
			sigma.setGraph(graph);
			sigma.refresh();
		}
	}, [graph]);

	// Apply theme changes
	useEffect(() => {
		const sigma = sigmaRef.current;

		if (sigma) {
			sigma.setSetting("defaultEdgeColor", edgeColor);
			sigma.setSetting("labelColor", { color: nodeLabelColor });
			sigma.setSetting("edgeLabelColor", { color: edgeLabelColor });
		}
	}, [edgeColor, nodeLabelColor, edgeLabelColor]);

	// Apply hidden nodes/edges/tables
	useEffect(() => {
		const sigma = sigmaRef.current;

		hiddenNodesRef.current = hiddenNodes || [];
		hiddenEdgesRef.current = hiddenEdges || [];
		hiddenTablesRef.current = hiddenTables || [];

		if (sigma) {
			sigma.refresh();
		}
	}, [hiddenNodes, hiddenTables, hiddenEdges]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Initial setup
	useEffect(() => {
		if (!ref.current) return;

		const instance = new Sigma<RelationGraphNode, RelationGraphEdge>(graph, ref.current, {
			defaultEdgeColor: edgeColor,
			allowInvalidContainer: true,
			renderEdgeLabels: true,
			labelFont: "JetBrains Mono",
			labelColor: { color: nodeLabelColor },
			labelSize: 10,
			edgeLabelColor: { color: edgeLabelColor },
			labelRenderedSizeThreshold: 12,
			edgeLabelSize: 10,
			stagePadding: 50,
			defaultNodeType: "border",
			defaultDrawNodeHover: drawHover,
			defaultDrawNodeLabel: drawLabel,
			edgeProgramClasses: {
				arrow: createEdgeCurveProgram<RelationGraphNode, RelationGraphEdge>({
					arrowHead: {
						widenessToThicknessRatio: 4,
						lengthToThicknessRatio: 5,
						extremity: "target",
					},
				}),
			},
			nodeProgramClasses: {
				border: createNodeBorderProgram<RelationGraphNode, RelationGraphEdge>({
					borders: [
						{ color: { attribute: "color" }, size: { value: 0.1 } },
						{ color: { transparent: true }, size: { value: 0.1 } },
						{ color: { attribute: "color" }, size: { value: 1.0 } },
					],
				}),
			},
			nodeReducer: (node, data) => {
				const res: Partial<NodeDisplayData> = { ...data };
				const graph = graphRef.current;
				const focus = focusRef.current;
				const hiddenNodes = hiddenNodesRef.current;
				const hiddenTables = hiddenTablesRef.current;
				const hiddenEdges = hiddenEdgesRef.current;
				const isLight = getIsLight();

				// Hide hidden nodes and tables
				if (hiddenNodes.includes(node) || hiddenTables.includes(data.record.tb)) {
					res.hidden = true;
					return res;
				}

				const isStray = graph.edges(node).every((edge) => {
					const { record } = graph.getEdgeAttributes(edge);

					return hiddenEdges.includes(record.tb);
				});

				// Hide when all edges are hidden
				if (isStray) {
					res.hidden = true;
					return res;
				}

				// Focus highlighting
				if (
					focus.hoveredNode &&
					!focus.neighbours.has(node) &&
					focus.hoveredNode !== node
				) {
					res.label = "";
					res.color = isLight ? theme.colors.slate[2] : theme.colors.slate[6];
				}

				return res;
			},
			edgeReducer: (edge, data) => {
				const res: Partial<EdgeDisplayData> = { ...data };
				const graph = graphRef.current;
				const focus = focusRef.current;
				const hiddenEdges = hiddenEdgesRef.current;

				// Hide hidden edges
				if (hiddenEdges.includes(data.record.tb)) {
					res.hidden = true;
					return res;
				}

				// Focus highlighting
				if (
					focus.hoveredNode &&
					!graph
						.extremities(edge)
						.every(
							(n) =>
								n === focus.hoveredNode || graph.areNeighbors(n, focus.hoveredNode),
						)
				) {
					res.hidden = true;
				}

				return res;
			},
		});

		sigmaRef.current = instance;

		instance.on("doubleClickNode", ({ node, event }) => {
			const nodeDisplayData = instance.getNodeDisplayData(node);

			if (nodeDisplayData) {
				instance.getCamera().animate({ ...nodeDisplayData, ratio: 0.15 });
			}

			inspect(node);
			event.original.preventDefault();
			event.original.stopPropagation();
			event.preventSigmaDefault();
		});

		instance.on("enterNode", ({ node }) => {
			const graph = graphRef.current;

			focusRef.current.hoveredNode = node;
			focusRef.current.neighbours = new Set(graph.neighbors(node));

			instance.refresh({
				skipIndexation: true,
			});
		});

		instance.on("leaveNode", () => {
			focusRef.current.hoveredNode = "";
			focusRef.current.neighbours = new Set();

			instance.refresh({
				skipIndexation: true,
			});
		});

		instance.on("rightClickNode", ({ node, event }) => {
			const origin = event.original as unknown as MouseEvent;

			event.preventSigmaDefault();
			origin.preventDefault();
			origin.stopPropagation();

			// showContextMenu([
			// 	{
			// 		key: "inspect",
			// 		title: "Inspect record",
			// 		icon: <Icon path={iconSearch} />,
			// 		onClick: () => inspect(node),
			// 	},
			// 	{
			// 		key: "divider-1",
			// 	},
			// 	{
			// 		key: "hide",
			// 		title: "Hide record",
			// 		icon: <Icon path={iconEyeOff} />,
			// 		onClick: () => onHideNode?.(node),
			// 	},
			// 	{
			// 		key: "expand",
			// 		title: "Expand relationships...",
			// 		icon: <Icon path={iconRelation} />,
			// 		onClick: () => {
			// 			// TODO
			// 		},
			// 	},
			// 	{
			// 		key: "copy-id",
			// 		title: "Copy record id",
			// 		icon: <Icon path={iconCopy} />,
			// 		onClick: () => {
			// 			navigator.clipboard.writeText(node);
			// 		},
			// 	},
			// ])(origin);

			showContextMenu((onHide) => (
				<NodeContextMenu
					node={node}
					inspect={inspect}
					onHideMenu={onHide}
				/>
			))(origin);
		});

		return () => {
			instance.kill();
			sigmaRef.current = null;
		};
	}, []);

	return (
		<Box
			pos="relative"
			{...other}
		>
			<Box
				h="100%"
				ref={ref}
				onContextMenu={showContextMenu([
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
					{ key: "divider" },
					{
						key: "download-png",
						icon: <Icon path={iconImage} />,
						title: "Export as PNG",
						disabled: true,
						onClick: () => {},
					},
					{
						key: "download-svg",
						icon: <Icon path={iconAPI} />,
						title: "Export as SVG",
						disabled: true,
						onClick: () => {},
					},
				])}
			/>
			<Paper
				withBorder
				pos="absolute"
				right={controlOffsetRight || 0}
				top={controlOffsetTop || 0}
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
						onClick={() => onReset?.()}
					>
						<Icon path={iconReset} />
					</ActionButton>
					<ActionButton
						label={isSupervising ? "Pause layout" : "Resume layout"}
						color={isSupervising ? undefined : "orange"}
						onClick={() => onChangeSupervising?.(!isSupervising)}
					>
						<Icon path={isSupervising ? iconStop : iconPlay} />
					</ActionButton>
				</Stack>
			</Paper>
		</Box>
	);
}
