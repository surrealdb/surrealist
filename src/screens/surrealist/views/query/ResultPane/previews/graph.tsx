import {
	Box,
	BoxProps,
	Center,
	Checkbox,
	ElementProps,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	useMantineTheme,
} from "@mantine/core";

import { useEffect, useMemo, useRef } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import {
	iconAPI,
	iconCheck,
	iconCircle,
	iconCircleFilled,
	iconFullscreen,
	iconImage,
	iconMagnifyMinus,
	iconMagnifyPlus,
	iconPlus,
	iconRelation,
} from "~/util/icons";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";
import Graph, { MultiDirectedGraph } from "graphology";
import { createEdgeArrowProgram } from "sigma/rendering";
import { Sigma } from "sigma";
import { useIsLight } from "~/hooks/theme";
import { useInspector } from "~/providers/Inspector";
import { useContextMenu } from "mantine-contextmenu";
import { useInputState } from "@mantine/hooks";
import { Label } from "~/components/Label";
import iwanthue from "iwanthue";
import { ActionButton } from "~/components/ActionButton";
import { useStable } from "~/hooks/stable";
import { Entry } from "~/components/Entry";

const RECORDS = new Gap<RecordId[]>([]);
const QUERY = new PreparedQuery(
	"return graph::find_relations($records).map(|$r| [$r[0], $r[1], $r[1].tb(), $r[2]])",
	{ records: RECORDS },
);

export function GraphPreview({ responses, selected }: PreviewProps) {
	const { inspect } = useInspector();
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	const [showIsolated, setShowIsolated] = useInputState(true);

	const flattened = useMemo(() => {
		const ids: RecordId[] = [];

		function flatten(data: any) {
			if (isArray(data)) {
				for (const item of data) {
					flatten(item);
				}
			} else if (isObject(data)) {
				for (const item of Object.values(data)) {
					flatten(item);
				}
			} else if (data instanceof RecordId) {
				ids.push(data);
			}
		}

		flatten(result);

		return ids;
	}, [result]);

	const { data, isFetching } = useQuery({
		queryKey: ["graph", flattened, showIsolated],
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const [response] = await executeQuery(QUERY, [RECORDS.fill(flattened)]);
			const relations = response.result as [RecordId, RecordId, string, RecordId][];

			if (relations.length === 0) {
				return null;
			}

			const tables = unique(flattened.map((record) => record.tb));
			const palette = iwanthue(tables.length);

			const elkGraph = {
				id: "root",
				layoutOptions: {
					"elk.algorithm": "force",
					"elk.spacing.nodeNode": "1",
				},
				children: flattened.map((id) => ({
					id: id.toString(),
					table: id.tb,
					color: palette[tables.indexOf(id.tb)],
				})),
				edges: relations.map(([source, edgeId, edgeName, target]) => ({
					id: edgeId.toString(),
					sources: [source.toString()],
					targets: [target.toString()],
					name: edgeName,
				})),
			};

			const ELK = await import("elkjs/lib/elk.bundled");
			const elk = new ELK.default();

			const layout = await elk.layout(elkGraph);
			const graph = new MultiDirectedGraph();

			// Add nodes with positions
			for (const node of layout.children ?? []) {
				if (graph.hasNode(node.id)) continue;

				if ("color" in node) {
					graph.addNode(node.id, {
						x: node.x,
						y: node.y,
						size: 15,
						label: node.id,
						color: node.color,
					});
				}
			}

			// Add edges
			for (const edge of layout.edges ?? []) {
				if (edge.sources[0] === edge.targets[0] || graph.hasEdge(edge.id)) continue;

				if ("name" in edge) {
					graph.addDirectedEdgeWithKey(edge.id, edge.sources[0], edge.targets[0], {
						size: 0,
						label: edge.name,
						type: "arrow",
					});
				}
			}

			// Map tables with colors
			const tableInfo = tables.map((table, i) => ({ name: table, color: palette[i] }));

			return [graph, tableInfo] as const;
		},
	});

	const [graph, tables] = data ?? [];

	return success ? (
		<Group
			flex={1}
			align="stretch"
			gap={0}
		>
			{isFetching ? (
				<Center flex={1}>
					<Loader />
				</Center>
			) : graph ? (
				<RelationGraph
					graph={graph}
					onClickNode={inspect}
					flex={1}
				/>
			) : (
				<Center
					h="100%"
					mih={80}
					c="slate"
				>
					<Stack>
						<Icon
							path={iconRelation}
							mx="auto"
							size="lg"
						/>
						This response cannot be visualized as a graph
					</Stack>
				</Center>
			)}
			<Box>
				<Paper
					h="100%"
					withBorder
					w={225}
					p="xl"
				>
					<Stack h="100%">
						<Label>Settings</Label>
						<Checkbox
							label="Show isolated records"
							checked={showIsolated}
							onChange={setShowIsolated}
						/>
						<Box>
							<Label mt="xl">Tables</Label>
							{tables?.map((info) => (
								<Entry
									key={info.name}
									leftSection={
										<Icon
											path={iconCircleFilled}
											size="xl"
											mx={-8}
											c={info.color}
										/>
									}
									rightSection={
										<Icon
											path={iconCheck}
											c="bright"
										/>
									}
								>
									{info.name}
								</Entry>
							))}
						</Box>
					</Stack>
				</Paper>
			</Box>
		</Group>
	) : (
		<Text
			pl="md"
			pt="sm"
			fz={textSize}
			c="red"
			ff="mono"
			style={{ whiteSpace: "pre-wrap" }}
		>
			{result}
		</Text>
	);
}

interface RelationGraphProps extends BoxProps, ElementProps<"div"> {
	graph: Graph;
	onClickNode?: (node: string) => void;
}

function RelationGraph({ graph, onClickNode, ...other }: RelationGraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const { showContextMenu } = useContextMenu();

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
			defaultEdgeType: "arrow",
			edgeProgramClasses: {
				arrow: createEdgeArrowProgram({
					widenessToThicknessRatio: 4,
					lengthToThicknessRatio: 4,
				}),
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
				right={10}
				bottom={0}
				p="xs"
			>
				<Stack>
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
