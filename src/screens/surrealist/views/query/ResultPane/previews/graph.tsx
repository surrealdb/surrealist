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
	UnstyledButton,
} from "@mantine/core";

import { iconBraces, iconEyeOff, iconFilter, iconRelation } from "~/util/icons";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { equals, Gap, PreparedQuery, RecordId } from "surrealdb";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useQuery } from "@tanstack/react-query";
import Graph, { MultiDirectedGraph } from "graphology";
import { Label } from "~/components/Label";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { RelationGraph } from "~/components/RelationGraph";
import { useIsLight } from "~/hooks/theme";
import { __throw, showInfo } from "~/util/helpers";
import { useStable } from "~/hooks/stable";
import { useToggleList } from "~/hooks/toggle";
import { circular } from "graphology-layout";
import { NodeCircle } from "~/components/RelationGraph/node";
import {
	RelationGraphNode,
	RelationGraphEdge,
	GraphExpansion,
} from "~/components/RelationGraph/types";

const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];
const RECORDS = new Gap<RecordId[]>();
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
	const [expandedNodes, setExpandedNodes] = useState<RecordId[]>([]);
	const [supervising, setSupervising] = useState(false);
	const [graph, setGraph] = useState<Graph<RelationGraphNode, RelationGraphEdge> | null>(null);
	const [strayCount, setStrayCount] = useState(0);
	const [recordCount, setRecordCount] = useState(0);
	const [edgeCount, setEdgeCount] = useState(0);

	// Extract and fetch graph records from result
	const { isPending, data, refetch } = useQuery({
		queryKey: ["graph-relation", query.id],
		enabled: !!result,
		refetchOnMount: false,
		refetchOnWindowFocus: false,
		queryFn: async () => {
			const universe = new Set<RecordId>();

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
					universe.add(data);
				}
			}

			flatten(result);

			for (const expand of expandedNodes) {
				universe.add(expand);
			}

			const records = Array.from(universe);
			const [response] = await executeQuery(QUERY, [RECORDS.fill(records)]);
			const relations = response.result as [RecordId, RecordId, RecordId][];
			const tables = unique(relations.flatMap((record) => [record[0].tb, record[2].tb]));
			const edges = unique(relations.map((record) => record[1].tb));

			setHiddenNodes([]);
			setHiddenTables([]);
			setHiddenEdges([]);

			return {
				records,
				relations,
				tables,
				edges,
			} as const;
		},
	});

	const { records, relations, tables, edges } = data ?? {
		records: [],
		relations: [],
		tables: [],
		edges: [],
	};

	const updateSupervising = useStable((value: boolean) => {
		setSupervising(value);
		supervisorRef.current?.[value ? "start" : "stop"]();
	});

	const handleHideNode = useStable((node: RecordId) => {
		toggleNode(node.toString());
	});

	const handleExpand = useStable(async ({ record, direction, edge }: GraphExpansion) => {
		const query = `SELECT VALUE id FROM $current${direction}${edge}${direction}?`;

		const [response] = await executeQuery(query, { current: record });
		const expansion = response.result as RecordId[];

		if (expansion.length > 0) {
			setExpandedNodes((curr) => [...curr, ...expansion]);
			refetch();
		}
	});

	// Compute the color palette
	const palette = useMemo(() => {
		return iwanthue(tables.length || 1, {
			seed: "surrealist",
			colorSpace: SURREAL_SPACE,
		});
	}, [tables]);

	// Compute graph layout
	useEffect(() => {
		const graph = new MultiDirectedGraph<RelationGraphNode, RelationGraphEdge>();

		const skipNodes = new Set(hiddenNodes);
		const skipTables = new Set(hiddenTables);
		const skipEdges = new Set(hiddenEdges);

		// Add nodes with positions
		for (const record of records) {
			const id = record.toString();

			if (!graph.hasNode(id) && !skipNodes.has(id) && !skipTables.has(record.tb)) {
				const color = palette[tables.indexOf(record.tb)];

				graph.addNode(id, {
					x: 0,
					y: 0,
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
				!skipEdges.has(edge.tb) &&
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

		// Apply predictible initial layout
		circular.assign(graph);

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

		setGraph(graph);
		setRecordCount(recordCount);
		setEdgeCount(edgeCount);
		setStrayCount(strayCount);
	}, [records, relations, tables, palette, hiddenTables, hiddenNodes, hiddenEdges]);

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
						onChangeSupervising={updateSupervising}
						onHideNode={handleHideNode}
						onExpandNode={handleExpand}
						onReset={refetch}
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
									{hiddenNodes.length > 0 && (
										<Group gap="xs">
											<Icon
												path={iconEyeOff}
												color="slate.4"
												size="sm"
											/>
											{hiddenNodes.length.toString()} hidden records
										</Group>
									)}
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
											{tables.map((table, i) => {
												const isHidden = hiddenTables.includes(table);

												return (
													<Group
														key={table}
														component={UnstyledButton}
														gap="sm"
														w="100%"
													>
														<Checkbox
															size="xs"
															label={table}
															flex={1}
															checked={!isHidden}
															onChange={() => toggleTable(table)}
														/>
														{!isHidden && (
															<NodeCircle
																color={palette[i]}
																size={10}
															/>
														)}
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
											{edges.map((edge) => (
												<Group
													key={edge}
													component={UnstyledButton}
													gap="sm"
													w="100%"
												>
													<Checkbox
														size="xs"
														label={edge}
														flex={1}
														checked={!hiddenEdges.includes(edge)}
														onChange={() => toggleEdge(edge)}
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
