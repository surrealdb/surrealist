import {
	Box,
	Center,
	Checkbox,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";

import { iconBraces, iconCircleFilled, iconFilter, iconRelation } from "~/util/icons";

import { useMemo } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { equals, Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";
import { MultiDirectedGraph } from "graphology";
import { useInspector } from "~/providers/Inspector";
import { Label } from "~/components/Label";
import iwanthue from "iwanthue";
import forceAtlas2, { inferSettings } from "graphology-layout-forceatlas2";
import { circular } from "graphology-layout";
import { RelationGraph } from "~/components/RelationGraph";
import { ColorDistributor } from "~/util/colors";

const RECORDS = new Gap<RecordId[]>([]);
const QUERY = new PreparedQuery("return graph::find_relations($records)", { records: RECORDS });

export function GraphPreview({ responses, selected }: PreviewProps) {
	const { inspect } = useInspector();
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	// const [showIsolated, setShowIsolated] = useInputState(true);

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
				const relations = response.result as [RecordId, RecordId, RecordId][];

				if (relations.length === 0) {
					return null;
				}

				const graph = new MultiDirectedGraph();
				const tables = unique(relations.flatMap((record) => [record[0].tb, record[2].tb]));
				const edges = unique(relations.map((record) => record[1].tb));

				const palette = iwanthue(tables.length, {
					seed: "surrealist",
				});

				// const preferredColors = ["#fe38b4", "#FF0000"];

				// const distributor = new ColorDistributor(preferredColors, 0.5);
				// const palette = distributor.generateColors(tables.length);

				// Add nodes with positions
				for (const record of flattened) {
					const id = record.toString();

					if (graph.hasNode(id)) continue;

					graph.addNode(id, {
						x: 0,
						y: 0,
						size: 12,
						label: id,
						color: palette[tables.indexOf(record.tb)],
					});
				}

				// Add edges
				for (const [source, edge, target] of relations) {
					const id = edge.toString();

					if (equals(source, target) || graph.hasEdge(id)) continue;

					graph.addDirectedEdgeWithKey(id, source.toString(), target.toString(), {
						label: edge.tb,
						type: "arrow",
					});
				}

				// Count node size
				const originalOrder = graph.order;

				// Remove stray nodes
				graph.forEachNode((node) => {
					if (graph.degree(node) === 0) {
						graph.dropNode(node);
					}
				});

				const recordCount = graph.order;
				const edgeCount = graph.size;
				const strayCount = originalOrder - recordCount;

				circular.assign(graph, { scale: 900 });

				forceAtlas2.assign(graph, {
					iterations: 200,
					settings: inferSettings(graph),
				});

				// Map tables with colors
				const tableInfo = tables.map((table, i) => ({ name: table, color: palette[i] }));

				// Compute statistics
				const statistics = {
					recordCount,
					edgeCount,
					strayCount,
				};

				console.log("bruh 1");

				return [graph, tableInfo, edges, statistics] as const;
			} catch (e) {
				console.error(e);
				return null;
			}
		},
	});

	const [graph, tables, edges, stats] = data ?? [];

	return success ? (
		<Group
			flex={1}
			align="stretch"
			gap="md"
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
					c="slate"
					flex={1}
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
			<Box
				w={225}
				pos="relative"
				mr={-12}
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					inset={0}
				>
					<Stack
						gap="xl"
						pr={12}
					>
						<Box>
							<Label>Statistics</Label>
							<Group gap="xs">
								<Icon
									path={iconBraces}
									color="slate.4"
									size="sm"
								/>
								{stats?.recordCount || 0} records visible
							</Group>
							<Group gap="xs">
								<Icon
									path={iconRelation}
									color="slate.4"
									size="sm"
								/>
								{stats?.edgeCount || 0} edges visible
							</Group>
							<Group gap="xs">
								<Icon
									path={iconFilter}
									color="slate.4"
									size="sm"
								/>
								{stats?.strayCount || 0} stray records filtered
							</Group>
						</Box>
						<Box>
							<Label>Tables</Label>
							{tables?.map((info) => (
								<Group
									key={info.name}
									component={UnstyledButton}
									gap="sm"
									w="100%"
								>
									<Checkbox
										checked
										size="xs"
									/>
									<Text
										flex={1}
										truncate
									>
										{info.name}
									</Text>
									<Icon
										path={iconCircleFilled}
										size="xl"
										mx={-8}
										c={info.color}
									/>
								</Group>
							))}
						</Box>
						<Box>
							<Label>Edges</Label>
							{edges?.map((info) => (
								<Group
									key={info}
									component={UnstyledButton}
									gap="sm"
									w="100%"
								>
									<Checkbox
										checked
										size="xs"
									/>
									<Text
										flex={1}
										truncate
									>
										{info}
									</Text>
								</Group>
							))}
						</Box>
					</Stack>
				</ScrollArea>
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
