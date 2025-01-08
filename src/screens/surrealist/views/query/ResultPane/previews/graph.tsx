import { Box, Center, Loader, Stack, Text, useMantineTheme } from "@mantine/core";
import { useEffect, useMemo, useRef } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { iconRelation } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { isArray, isObject } from "radash";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";
import Graph, { MultiDirectedGraph } from "graphology";
import { createEdgeArrowProgram } from "sigma/rendering";
import { Sigma } from "sigma";
import { useIsLight } from "~/hooks/theme";
import { useInspector } from "~/providers/Inspector";

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
		queryKey: ["graph", flattened],
		refetchOnWindowFocus: false,
		queryFn: async () => {
			try {
				const [response] = await executeQuery(QUERY, [RECORDS.fill(flattened)]);
				const relations = response.result as [RecordId, RecordId, string, RecordId][];

				if (relations.length === 0) {
					return null;
				}

				const elkGraph = {
					id: "root",
					layoutOptions: {
						"elk.algorithm": "force",
						"elk.spacing.nodeNode": "1",
					},
					children: flattened.map((id) => ({
						id: id.toString(),
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
					graph.addNode(node.id, {
						x: node.x,
						y: node.y,
						size: 15,
						label: node.id,
					});
				}

				// Add edges
				for (const edge of layout.edges ?? []) {
					if (edge.sources[0] === edge.targets[0]) continue;

					if ("name" in edge) {
						graph.addDirectedEdge(edge.sources[0], edge.targets[0], {
							size: 0,
							label: edge.name,
							type: "arrow",
						});
					}
				}

				return graph;
			} catch (err: any) {
				console.error(err);
				return null;
			}
		},
	});

	return success ? (
		isFetching ? (
			<Center flex={1}>
				<Loader />
			</Center>
		) : data ? (
			<RelationGraph
				graph={data}
				onClickNode={inspect}
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
		)
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

interface RelationGraphProps {
	graph: Graph;
	onClickNode?: (node: string) => void;
}

function RelationGraph({ graph, onClickNode }: RelationGraphProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);
	const theme = useMantineTheme();
	const isLight = useIsLight();

	const edgeColor = isLight ? theme.colors.slate[3] : theme.colors.slate[5];
	const nodeLabelColor = isLight ? theme.colors.slate[9] : theme.colors.slate[0];
	const edgeLabelColor = isLight ? theme.colors.slate[5] : theme.colors.slate[2];

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
			nodeReducer: (node, data) => {
				return { ...data, highlighted: false };
			},
		});

		sigma.current = instance;

		instance.on("clickNode", ({ node }) => {
			onClickNode?.(node);
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
			console.log(graph);
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
			flex={1}
			ref={ref}
		/>
	);
}
