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

import { useEffect, useRef, useState } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { equals, Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";
import { MultiDirectedGraph } from "graphology";
import { Label } from "~/components/Label";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { RelationGraphEdge, RelationGraph, RelationGraphNode } from "~/components/RelationGraph";
import { useIsLight } from "~/hooks/theme";
import { __throw } from "~/util/helpers";
import { useStable } from "~/hooks/stable";
import { useToggleList } from "~/hooks/toggle";

const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];
const RECORDS = new Gap<RecordId[]>([]);
const QUERY = new PreparedQuery(
	"SELECT VALUE [in, id, out] FROM $records<->(? WHERE out IN $records AND in IN $records).flatten() WHERE __ == true",
	{ records: RECORDS },
);

export function GraphPreview({ responses, selected, query }: PreviewProps) {
	const isLight = useIsLight();
	const { success, result } = responses[selected] ?? { result: null };
	const [editorScale] = useSetting("appearance", "editorScale");
	const textSize = Math.floor(15 * (editorScale / 100));
	const supervisorRef = useRef<FA2LayoutSupervisor | null>(null);

	const [hiddenNodes, toggleNode, setHiddenNodes] = useToggleList();
	const [hiddenTables, toggleTable, setHiddenTables] = useToggleList();
	const [hiddenEdges, toggleEdge, setHiddenEdges] = useToggleList();
	const [supervising, setSupervising] = useState(false);

	const { isPending, data, refetch } = useQuery({
		queryKey: ["graph-relation", query.id],
		enabled: !!result,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		queryFn: async () => {
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

			flatten(result);

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
			const graph = new MultiDirectedGraph<RelationGraphNode, RelationGraphEdge>();

			// Add nodes with positions
			for (const record of records) {
				const id = record.toString();

				if (!graph.hasNode(id)) {
					const color = palette[tableNames.indexOf(record.tb)];

					graph.addNode(id, {
						x: Math.random(),
						y: Math.random(),
						size: 9,
						label: id,
						color: color,
						record: record,
					});
				}
			}

			// Add edges between nodes
			for (const [source, edge, target] of relations) {
				const id = edge.toString();
				const src = source.toString();
				const tgt = target.toString();

				if (
					!equals(source, target) &&
					!graph.hasEdge(id) &&
					graph.hasNode(src) &&
					graph.hasNode(tgt)
				) {
					graph.addDirectedEdgeWithKey(id, src, tgt, {
						label: edge.tb,
						type: "arrow",
						weight: source.tb === target.tb ? 2 : 1,
						record: edge,
					});
				}
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

			// Apply layout supervisor
			supervisorRef.current?.kill();

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
			setSupervising(true);

			// Reveal all nodes
			setHiddenNodes([]);
			setHiddenTables([]);
			setHiddenEdges([]);

			return {
				graph,
				tables,
				edges,
				recordCount,
				edgeCount,
				strayCount,
			} as const;
		},
	});

	const updateSupervising = useStable((value: boolean) => {
		setSupervising(value);
		supervisorRef.current?.[value ? "start" : "stop"]();
	});

	const handleHideNode = useStable((node: string) => {
		toggleNode(node);
	});

	const { tables, edges, graph, recordCount, edgeCount, strayCount } = data ?? {
		tables: [],
		edges: [],
		graph: null,
		recordCount: 0,
		edgeCount: 0,
		strayCount: 0,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		refetch();
	}, [result, refetch]);

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
				{isPending ? (
					<Center flex={1}>
						<Loader />
					</Center>
				) : graph ? (
					<RelationGraph
						graph={graph}
						controlOffsetTop={12}
						isSupervising={supervising}
						hiddenNodes={hiddenNodes}
						hiddenEdges={hiddenEdges}
						hiddenTables={hiddenTables}
						onChangeSupervising={updateSupervising}
						onHideNode={handleHideNode}
						onReset={() => refetch(result)}
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
									<Skeleton visible={isPending}>
										<Group gap="xs">
											<Icon
												path={iconBraces}
												color="slate.4"
												size="sm"
											/>
											{recordCount.toString()} records
										</Group>
									</Skeleton>
									<Skeleton visible={isPending}>
										<Group gap="xs">
											<Icon
												path={iconRelation}
												color="slate.4"
												size="sm"
											/>
											{edgeCount.toString()} edges
										</Group>
									</Skeleton>
									<Skeleton visible={isPending}>
										<Group gap="xs">
											<Icon
												path={iconFilter}
												color="slate.4"
												size="sm"
											/>
											{strayCount.toString()} stray records
										</Group>
									</Skeleton>
								</Stack>
							</Box>
							<Box>
								<Label mb="xs">Tables</Label>
								<Stack gap="xs">
									{isPending ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{tables?.map((info) => {
												const isHidden = hiddenTables.includes(info.name);

												return (
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
															checked={!isHidden}
															onChange={() => toggleTable(info.name)}
														/>
														<Transition
															transition="fade"
															duration={75}
															mounted={!isHidden}
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
												);
											})}
										</>
									)}
								</Stack>
							</Box>
							<Box>
								<Label mb="xs">Edges</Label>
								<Stack gap="xs">
									{isPending ? (
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
