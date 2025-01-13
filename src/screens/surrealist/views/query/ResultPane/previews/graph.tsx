import {
	Box,
	Center,
	Checkbox,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Text,
	Transition,
	UnstyledButton,
} from "@mantine/core";

import { iconBraces, iconCircleFilled, iconFilter, iconRelation } from "~/util/icons";

import { useEffect, useRef } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { equals, Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { MultiDirectedGraph } from "graphology";
import { useInspector } from "~/providers/Inspector";
import { Label } from "~/components/Label";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { RelationGraph } from "~/components/RelationGraph";
import { useToggleList } from "~/hooks/toggle";
import { useIsLight } from "~/hooks/theme";
import { __throw } from "~/util/helpers";

const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];
const RECORDS = new Gap<RecordId[]>([]);
const QUERY = new PreparedQuery(
	"SELECT VALUE [in, id, out] FROM $records<->(? WHERE out IN $records AND in IN $records).flatten() WHERE __ == true",
	{ records: RECORDS },
);

export function GraphPreview({ responses, selected, query }: PreviewProps) {
	const isLight = useIsLight();
	const { inspect } = useInspector();
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));

	const [hiddenTables, toggleTable, setHiddenTables] = useToggleList();
	const [hiddenEdges, toggleEdge, setHiddenEdges] = useToggleList();

	const supervisorRef = useRef<FA2LayoutSupervisor | null>(null);

	const relationMutation = useMutation({
		mutationKey: ["graph-relation", query.id],
		throwOnError: true,
		mutationFn: async (structure: any) => {
			const records: RecordId[] = [];

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
					records.push(data);
				}
			}

			flatten(structure);

			const [response] = await executeQuery(QUERY, [RECORDS.fill(records)]);
			const relations = response.result as [RecordId, RecordId, RecordId][];

			if (relations.length === 0) {
				return null;
			}

			const tableNames = unique(relations.flatMap((record) => [record[0].tb, record[2].tb]));
			const edgeNames = unique(relations.map((record) => record[1].tb));

			const palette = iwanthue(tableNames.length, {
				seed: "surrealist",
				colorSpace: SURREAL_SPACE,
			});

			const tables = tableNames.map((table, i) => ({ name: table, color: palette[i] }));
			const edges = edgeNames.map((edge) => ({ name: edge }));

			return { records, relations, tables, tableNames, edges, edgeNames, palette } as const;
		},
	});

	const layoutQuery = useQuery({
		queryKey: ["graph-layout", relationMutation.data, hiddenEdges, hiddenTables],
		refetchOnWindowFocus: true,
		throwOnError: true,
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!relationMutation.data) {
				return null;
			}

			const graph = new MultiDirectedGraph();
			const { records, relations, tableNames, palette } = relationMutation.data;

			// Add nodes with positions
			for (const record of records) {
				const id = record.toString();

				if (graph.hasNode(id) || hiddenTables.includes(record.tb)) continue;

				graph.addNode(id, {
					x: Math.random(),
					y: Math.random(),
					size: 9,
					label: id,
					color: palette[tableNames.indexOf(record.tb)],
				});
			}

			// Add edges between nodes
			for (const [source, edge, target] of relations) {
				const id = edge.toString();
				const src = source.toString();
				const tgt = target.toString();

				if (
					equals(source, target) ||
					graph.hasEdge(id) ||
					!graph.hasNode(src) ||
					!graph.hasNode(tgt) ||
					hiddenEdges.includes(edge.tb)
				)
					continue;

				graph.addDirectedEdgeWithKey(id, src, tgt, {
					label: edge.tb,
					type: "arrow",
					weight: source.tb === target.tb ? 2 : 1,
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

			// Compute statistics
			const recordCount = graph.order;
			const edgeCount = graph.size;
			const strayCount = originalOrder - recordCount;

			// Apply initial circular layout
			// circular.assign(graph, { scale: 10 });

			// Apply force atlas 2 layout
			supervisorRef.current?.kill();

			// forceAtlas2.assign(graph, {
			// 	iterations: 200,
			// 	settings: {
			// 		...inferSettings(graph),
			// 		edgeWeightInfluence: 1,
			// 		scalingRatio: 2,
			// 	},
			// });

			const supervisor = new FA2LayoutSupervisor(graph, {
				getEdgeWeight: "weight",
				settings: {
					...inferSettings(graph),
					edgeWeightInfluence: 1,
					scalingRatio: 2,
					slowDown: 1000,
				},
			});

			supervisorRef.current = supervisor;
			supervisor.start();

			setTimeout(() => {
				supervisor.stop();
			}, 5000);

			return {
				graph,
				recordCount,
				edgeCount,
				strayCount,
			} as const;
		},
	});

	const { tables, tableNames, edges, edgeNames } = relationMutation.data ?? {
		tableNames: [],
		edgeNames: [],
	};

	const { graph, recordCount, edgeCount, strayCount } = layoutQuery.data ?? {
		graph: null,
		recordCount: 0,
		edgeCount: 0,
		strayCount: 0,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset on tables/edges change
	useEffect(() => {
		setHiddenTables([]);
		setHiddenEdges([]);
	}, [tableNames, edgeNames]);

	useEffect(() => {
		relationMutation.mutate(result);
	}, [result, relationMutation.mutate]);

	return success ? (
		<Paper
			flex="1"
			bg={isLight ? "slate.0" : "slate.7"}
		>
			<Group
				h="100%"
				align="stretch"
				gap={0}
			>
				{layoutQuery.isPending ? (
					<Center flex={1}>
						<Loader />
					</Center>
				) : graph ? (
					<RelationGraph
						graph={graph}
						onClickNode={inspect}
						controlOffsetTop={12}
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
				<Paper
					w={225}
					pos="relative"
					shadow="sm"
					m="md"
				>
					<ScrollArea
						pos="absolute"
						scrollbars="y"
						type="scroll"
						inset={0}
					>
						<Stack
							gap="xl"
							p="lg"
						>
							<Box>
								<Label mb="xs">Statistics</Label>
								<Stack gap="xs">
									<Skeleton visible={layoutQuery.isPending}>
										<Group gap="xs">
											<Icon
												path={iconBraces}
												color="slate.4"
												size="sm"
											/>
											{recordCount.toString()} records visible
										</Group>
									</Skeleton>
									<Skeleton visible={layoutQuery.isPending}>
										<Group gap="xs">
											<Icon
												path={iconRelation}
												color="slate.4"
												size="sm"
											/>
											{edgeCount.toString()} edges visible
										</Group>
									</Skeleton>
									<Skeleton visible={layoutQuery.isPending}>
										<Group gap="xs">
											<Icon
												path={iconFilter}
												color="slate.4"
												size="sm"
											/>
											{strayCount.toString()} stray records filtered
										</Group>
									</Skeleton>
								</Stack>
							</Box>
							<Box>
								<Label mb="xs">Tables</Label>
								<Stack gap="xs">
									{relationMutation.isPending ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{tables?.map((info) => (
												<Group
													key={info.name}
													component={UnstyledButton}
													gap="sm"
													w="100%"
												>
													<Checkbox
														size="xs"
														label={info.name}
														flex={1}
														checked={!hiddenTables.includes(info.name)}
														onChange={() => toggleTable(info.name)}
													/>
													<Transition
														transition="fade"
														duration={75}
														mounted={!hiddenTables.includes(info.name)}
													>
														{(style) => (
															<Icon
																path={iconCircleFilled}
																c={info.color}
																size="sm"
																style={{
																	transform: "scale(2)",
																	...style,
																}}
															/>
														)}
													</Transition>
												</Group>
											))}
										</>
									)}
								</Stack>
							</Box>
							<Box>
								<Label mb="xs">Edges</Label>
								<Stack gap="xs">
									{relationMutation.isPending ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{edges?.map((info) => (
												<Group
													key={info.name}
													component={UnstyledButton}
													gap="sm"
													w="100%"
												>
													<Checkbox
														size="xs"
														label={info.name}
														flex={1}
														checked={!hiddenEdges.includes(info.name)}
														onChange={() => toggleEdge(info.name)}
													/>
												</Group>
											))}
										</>
									)}
								</Stack>
							</Box>
						</Stack>
					</ScrollArea>
				</Paper>
			</Group>
		</Paper>
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
