import {
	iconAPI,
	iconFullscreen,
	iconImage,
	iconMagnifyMinus,
	iconMagnifyPlus,
	iconPause,
	iconPlay,
	iconRelation,
	iconReset,
} from "~/util/icons";

import {
	Box,
	BoxProps,
	Center,
	ElementProps,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	Transition,
	useMantineTheme,
} from "@mantine/core";

import { createEdgeCurveProgram } from "@sigma/edge-curve";
import { createNodeBorderProgram } from "@sigma/node-border";
import { MultiDirectedGraph } from "graphology";
import { useContextMenu } from "mantine-contextmenu";
import { MouseEvent, useEffect, useRef } from "react";
import Sigma from "sigma";
import { createEdgeArrowProgram } from "sigma/rendering";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { RecordId } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { getIsLight, useIsLight } from "~/hooks/theme";
import { useInspector } from "~/providers/Inspector";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";
import { NodeContextMenu } from "./context";
import { drawHover, drawLabel } from "./drawing";
import {
	GraphEdges,
	GraphExpansion,
	RelationGraphEdge,
	RelationGraphNode,
	RelationalGraph,
} from "./types";

/**
 * Helper for creating a new relational graph.
 */
export function newRelationalGraph(): RelationalGraph {
	return new MultiDirectedGraph<RelationGraphNode, RelationGraphEdge>();
}

export interface RelationGraphProps extends BoxProps, ElementProps<"div"> {
	graph: RelationalGraph;
	controlOffsetTop?: number;
	controlOffsetRight?: number;
	isSupervising?: boolean;
	isWiring?: boolean;
	isEmpty?: boolean;
	queryEdges: (record: RecordId) => GraphEdges;
	onToggleSupervising?: () => void;
	onExpandNode?: (expansion: GraphExpansion) => void;
	onFetchExpansions?: (node: RecordId) => GraphExpansion[];
	onHideNode?: (node: RecordId) => void;
	onReset?: () => void;
}

export function RelationGraph({
	graph,
	controlOffsetTop,
	controlOffsetRight,
	isSupervising,
	isWiring,
	isEmpty,
	queryEdges,
	onToggleSupervising,
	onExpandNode,
	onHideNode,
	onReset,
	...other
}: RelationGraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigmaRef = useRef<Sigma | null>(null);
	const graphRef = useRef<RelationalGraph>(graph);
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const { showContextMenu } = useContextMenu();
	const { inspect } = useInspector();

	const focusRef = useRef({
		hoveredNode: "",
		neighbours: new Set<string>(),
	});

	const edgeColor = isLight ? theme.colors.slate[3] : theme.colors.slate[4];
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

	const handleFocus = useStable((node: RecordId) => {
		const instance = sigmaRef.current;

		if (instance) {
			const display = instance.getNodeDisplayData(node) as RelationGraphNode;

			if (display) {
				instance.getCamera().animate({ ...display, ratio: 0.15 });
			}
		}
	});

	// Apply theme changes
	useEffect(() => {
		const sigma = sigmaRef.current;

		if (sigma) {
			sigma.setSetting("defaultEdgeColor", edgeColor);
			sigma.setSetting("labelColor", { color: nodeLabelColor });
			sigma.setSetting("edgeLabelColor", { color: edgeLabelColor });
		}
	}, [edgeColor, nodeLabelColor, edgeLabelColor]);

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
			defaultNodeType: "default",
			defaultDrawNodeHover: drawHover,
			defaultDrawNodeLabel: drawLabel,
			edgeProgramClasses: {
				straight: createEdgeArrowProgram<RelationGraphNode, RelationGraphEdge>({
					widenessToThicknessRatio: 4,
					lengthToThicknessRatio: 5,
				}),
				curved: createEdgeCurveProgram<RelationGraphNode, RelationGraphEdge>({
					arrowHead: {
						widenessToThicknessRatio: 4,
						lengthToThicknessRatio: 5,
						extremity: "target",
					},
				}),
			},
			nodeProgramClasses: {
				default: createNodeBorderProgram<RelationGraphNode, RelationGraphEdge>({
					borders: [
						{ color: { attribute: "color" }, size: { value: 0.1 } },
						{ color: { transparent: true }, size: { value: 0.1 } },
						{ color: { attribute: "color" }, size: { value: 1.0 } },
					],
				}),
			},
			nodeReducer: (node, data) => {
				const res: Partial<NodeDisplayData> = { ...data };
				const focus = focusRef.current;
				const isLight = getIsLight();

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

				// Focus highlighting
				if (
					focus.hoveredNode &&
					!graph.extremities(edge).some((n) => n === focus.hoveredNode)
				) {
					res.hidden = true;
				}

				return res;
			},
		});

		sigmaRef.current = instance;

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

		instance.on("clickNode", ({ node, event }) => {
			if (!event.original.metaKey) return;

			const display = instance.getNodeDisplayData(node) as RelationGraphNode;

			inspect(display.record);

			event.original.preventDefault();
			event.original.stopPropagation();
			event.preventSigmaDefault();
		});

		instance.on("rightClickNode", ({ node, event }) => {
			const display = instance.getNodeDisplayData(node) as RelationGraphNode;
			const origin = event.original as unknown as MouseEvent;

			event.preventSigmaDefault();
			origin.preventDefault();
			origin.stopPropagation();

			showContextMenu((onHide) => (
				<NodeContextMenu
					node={display}
					inspect={inspect}
					queryEdges={queryEdges}
					onFocusNode={handleFocus}
					onHideMenu={onHide}
					onHideNode={onHideNode}
					onExpandNode={onExpandNode}
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
			<Transition
				transition="fade"
				mounted={isWiring ?? false}
				duration={100}
			>
				{(style) => (
					<Group
						pos="absolute"
						top={12}
						left={12}
						style={style}
					>
						<Loader size="xs" />
						<Text
							c="bright"
							fw={500}
							fz="lg"
							tt="uppercase"
						>
							Finding relationships
						</Text>
					</Group>
				)}
			</Transition>
			{isEmpty && (
				<Center
					pos="absolute"
					inset={0}
				>
					<Paper p="xl">
						<Group>
							<ThemeIcon
								radius="xs"
								variant="light"
								color="slate"
								size={40}
							>
								<Icon
									path={iconRelation}
									size="lg"
								/>
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									fz="lg"
								>
									Waiting for records to visualise
								</Text>
								<Text c="slate">Selected records will be shown here</Text>
							</Box>
						</Group>
					</Paper>
				</Center>
			)}
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
					{onToggleSupervising && (
						<ActionButton
							label={isSupervising ? "Pause layout" : "Resume layout"}
							color={isSupervising ? undefined : "orange"}
							onClick={onToggleSupervising}
						>
							<Icon path={isSupervising ? iconPause : iconPlay} />
						</ActionButton>
					)}
				</Stack>
			</Paper>
		</Box>
	);
}
