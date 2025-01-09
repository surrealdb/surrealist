import {
	iconMagnifyPlus,
	iconMagnifyMinus,
	iconFullscreen,
	iconImage,
	iconAPI,
} from "~/util/icons";

import { Box, BoxProps, ElementProps, Paper, Stack, useMantineTheme } from "@mantine/core";
import { createNodeBorderProgram } from "@sigma/node-border";
import Graph from "graphology";
import { useContextMenu } from "mantine-contextmenu";
import { useRef, useEffect } from "react";
import Sigma from "sigma";
import { NodeDisplayData } from "sigma/types";
import { createEdgeCurveProgram } from "@sigma/edge-curve";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { ActionButton } from "../ActionButton";
import { Icon } from "../Icon";

export interface RelationGraphProps extends BoxProps, ElementProps<"div"> {
	graph: Graph;
	onClickNode?: (node: string) => void;
}

export function RelationGraph({ graph, onClickNode, ...other }: RelationGraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const { showContextMenu } = useContextMenu();

	const focusRef = useRef({
		hoveredNode: "",
		neighbours: new Set<string>(),
	});

	const edgeColor = isLight ? theme.colors.slate[3] : theme.colors.slate[5];
	const nodeLabelColor = isLight ? theme.colors.slate[9] : theme.colors.slate[0];
	const edgeLabelColor = isLight ? theme.colors.slate[5] : theme.colors.slate[2];

	const handleZoomIn = useStable(() => {
		sigma.current?.refresh();
		sigma.current?.getCamera().animatedZoom();
	});

	const handleZoomOut = useStable(() => {
		sigma.current?.refresh();
		sigma.current?.getCamera().animatedUnzoom();
	});

	const handleResetZoom = useStable(() => {
		sigma.current?.refresh();
		sigma.current?.getCamera().animatedReset();
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Initial render
	useEffect(() => {
		if (!ref.current) return;

		const instance = new Sigma(graph, ref.current, {
			defaultEdgeColor: edgeColor,
			allowInvalidContainer: true,
			renderEdgeLabels: true,
			labelFont: "JetBrains Mono",
			labelColor: { color: nodeLabelColor },
			labelSize: 10,
			edgeLabelFont: "JetBrains Mono",
			edgeLabelColor: { color: edgeLabelColor },
			edgeLabelSize: 10,
			stagePadding: 50,
			defaultNodeType: "border",
			edgeProgramClasses: {
				arrow: createEdgeCurveProgram({
					arrowHead: {
						widenessToThicknessRatio: 4,
						lengthToThicknessRatio: 4,
						extremity: "target",
					},
				}),
			},
			nodeProgramClasses: {
				border: createNodeBorderProgram({
					borders: [
						{ color: { value: theme.colors.slate[5] }, size: { value: 0.1 } },
						{ color: { value: theme.colors.slate[0] }, size: { value: 0.1 } },
						{ color: { attribute: "color" }, size: { value: 1.0 } },
					],
				}),
			},
			nodeReducer: (node, data) => {
				const res: Partial<NodeDisplayData> = { ...data };
				const focus = focusRef.current;

				if (
					focus.hoveredNode &&
					!focus.neighbours.has(node) &&
					focus.hoveredNode !== node
				) {
					res.hidden = true;
				}

				return res;
			},
		});

		sigma.current = instance;

		instance.on("clickNode", ({ node }) => {
			onClickNode?.(node);

			const nodeDisplayData = instance.getNodeDisplayData(node);

			if (nodeDisplayData) {
				instance.getCamera().animate({ ...nodeDisplayData, ratio: 0.35 });
			}
		});

		instance.on("enterNode", ({ node }) => {
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

		return () => {
			instance.kill();
			sigma.current = null;
		};
	}, []);

	useEffect(() => {
		if (sigma.current) {
			sigma.current.clear();
			sigma.current.setGraph(graph);
			sigma.current.refresh();
		}
	}, [graph]);

	useEffect(() => {
		if (sigma.current) {
			sigma.current.setSetting("defaultEdgeColor", edgeColor);
			sigma.current.setSetting("labelColor", { color: nodeLabelColor });
			sigma.current.setSetting("edgeLabelColor", { color: edgeLabelColor });
		}
	}, [edgeColor, nodeLabelColor, edgeLabelColor]);

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
				</Stack>
			</Paper>
		</Box>
	);
}
