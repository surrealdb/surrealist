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

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSetting } from "~/hooks/config";
import { type PreviewProps } from ".";
import { Icon } from "~/components/Icon";
import { isArray, isObject, unique } from "radash";
import { equals, Gap, PreparedQuery, RecordId } from "surrealdb";
import { MultiDirectedGraph } from "graphology";
import { Label } from "~/components/Label";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { RelationGraph } from "~/components/RelationGraph";
import { useIsLight } from "~/hooks/theme";
import { __throw } from "~/util/helpers";
import { useStable } from "~/hooks/stable";
import { useToggleList } from "~/hooks/toggle";
import { NodeCircle } from "~/components/RelationGraph/node";
import {
	RelationGraphNode,
	RelationGraphEdge,
	GraphExpansion,
} from "~/components/RelationGraph/types";
import { useMutation } from "@tanstack/react-query";
import { executeQuery } from "~/screens/surrealist/connection/connection";

interface TableInfo {
	name: string;
	color: string;
}

interface EdgeInfo {
	name: string;
}

const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];
const RECORDS = new Gap<RecordId[]>();
const QUERY = new PreparedQuery(
	"SELECT VALUE [in, id, out] FROM $records<->(? WHERE out IN $records AND in IN $records).flatten() WHERE __ == true",
	{ records: RECORDS },
);

export function GraphPreview({ responses, selected, query }: PreviewProps) {
	const isLight = useIsLight();
	const supervisorRef = useRef<FA2LayoutSupervisor>();
	const [editorScale] = useSetting("appearance", "editorScale");
	const [graph] = useState(() => new MultiDirectedGraph<RelationGraphNode, RelationGraphEdge>());
	const [initializing, setInitializing] = useState(true);

	const [hiddenNodes, toggleNode, setHiddenNodes] = useToggleList();
	const [hiddenTables, toggleTable, setHiddenTables] = useToggleList();
	const [hiddenEdges, toggleEdge, setHiddenEdges] = useToggleList();
	const [expandedNodes, setExpandedNodes] = useState<RecordId[]>([]);
	const [supervising, setSupervising] = useState(false);
	const [strayCount, setStrayCount] = useState(0);
	const [recordCount, setRecordCount] = useState(0);
	const [edgeCount, setEdgeCount] = useState(0);
	const [tables, setTables] = useState<TableInfo[]>([]);
	const [edges, setEdges] = useState<EdgeInfo[]>([]);

	const { success, result } = responses[selected] ?? { result: null };
	const textSize = Math.floor(15 * (editorScale / 100));

	// Extract records from the query response
	const extractedNodes = useMemo(() => {
		const records = new Set<RecordId>();

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
				records.add(data);
			}
		}

		flatten(result);

		return records;
	}, [result]);

	// Compute the set of tables
	const tableSet = useMemo(() => {
		const tables = new Set<string>();

		// Append extracted tables
		for (const record of extractedNodes) {
			tables.add(record.tb);
		}

		// Append expanded tables
		for (const expand of expandedNodes) {
			tables.add(expand.tb);
		}

		return tables;
	}, [extractedNodes, expandedNodes]);

	// Compute the universe of nodes
	const universe = useMemo(() => {
		const universe = new Set<RecordId>();
		const skipTables = new Set(hiddenTables);
		const skipNodes = new Set(hiddenNodes);

		function append(record: RecordId) {
			if (universe.has(record)) {
				return;
			}

			if (skipTables.size > 0 && skipTables.has(record.tb)) {
				return;
			}

			if (skipNodes.size > 0 && skipNodes.has(record.toString())) {
				return;
			}

			universe.add(record);
		}

		// Append extracted nodes
		for (const record of extractedNodes) {
			append(record);
		}

		// Append expanded nodes
		for (const expand of expandedNodes) {
			append(expand);
		}

		return Array.from(universe);
	}, [hiddenTables, hiddenNodes, extractedNodes, expandedNodes]);

	// Mutate the graph with the universe
	const applyGraph = useStable(async (records: RecordId[]) => {
		const [response] = await executeQuery(QUERY, [RECORDS.fill(records)]);
		const relations = response.result as [RecordId, RecordId, RecordId][];
		const edges = unique(relations.map(([, edge]) => edge.tb));
		const tables = Array.from(tableSet);
		const skipEdges = new Set(hiddenEdges);

		// Compute the palette
		const paletteSize = Math.max(tables.length, 1);
		const palette = iwanthue(paletteSize, {
			seed: "surrealist",
			colorSpace: SURREAL_SPACE,
		});

		// Save current node positions
		const positions = new Map<string, [number, number]>();

		graph.forEachNode((node, attr) => {
			positions.set(node, [attr.x || 0, attr.y || 0]);
		});

		// Clear the graph
		graph.clear();

		// Add nodes with positions
		for (const record of records) {
			const id = record.toString();
			const color = palette[tables.indexOf(record.tb)];

			if (!graph.hasNode(id)) {
				graph.addNode(id, {
					x: positions.get(id)?.[0] || Math.random(),
					y: positions.get(id)?.[1] || Math.random(),
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

		// Compute table and edge information
		const tableInfo = tables.map((name, i) => ({ name, color: palette[i] }));
		const edgeInfo = edges.map((name) => ({ name }));

		setRecordCount(recordCount);
		setEdgeCount(edgeCount);
		setStrayCount(strayCount);
		setTables(tableInfo);
		setEdges(edgeInfo);
		setInitializing(false);
	});

	const resetGraph = useStable(() => {
		setInitializing(true);
		setHiddenNodes([]);
		setHiddenTables([]);
		setHiddenEdges([]);
		setExpandedNodes([]);
	});

	const updateSupervising = useStable((value: boolean) => {
		setSupervising(value);
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
		}
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Clear hidden nodes, tables, and edges on result change
	useEffect(() => {
		resetGraph();
	}, [result]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Update graph on universe or edge change
	useEffect(() => {
		applyGraph(universe);
	}, [universe, hiddenEdges]);

	useEffect(() => {
		const supervisor = new FA2LayoutSupervisor(graph, {
			getEdgeWeight: "weight",
			settings: {
				...inferSettings(graph),
				edgeWeightInfluence: 1,
				scalingRatio: 2,
				slowDown: 1000,
			},
		});

		supervisor.start();
		supervisorRef.current = supervisor;
		setSupervising(true);

		return () => {
			supervisor.kill();
		};
	});

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
				{initializing ? (
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
						onReset={resetGraph}
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
									<Skeleton visible={initializing}>
										<Group gap="xs">
											<Icon
												path={iconBraces}
												color="slate.4"
												size="sm"
											/>
											{recordCount.toString()} records
										</Group>
									</Skeleton>
									<Skeleton visible={initializing}>
										<Group gap="xs">
											<Icon
												path={iconRelation}
												color="slate.4"
												size="sm"
											/>
											{edgeCount.toString()} edges
										</Group>
									</Skeleton>
									<Skeleton visible={initializing}>
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
									{initializing ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{tables.map(({ name, color }, i) => {
												const isHidden = hiddenTables.includes(name);

												return (
													<Group
														key={name}
														component={UnstyledButton}
														gap="sm"
														w="100%"
													>
														<Checkbox
															size="xs"
															label={name}
															flex={1}
															checked={!isHidden}
															onChange={() => toggleTable(name)}
														/>
														{!isHidden && (
															<NodeCircle
																color={color}
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
									{initializing ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{edges.map(({ name }) => (
												<Group
													key={name}
													component={UnstyledButton}
													gap="sm"
													w="100%"
												>
													<Checkbox
														size="xs"
														label={name}
														flex={1}
														checked={!hiddenEdges.includes(name)}
														onChange={() => toggleEdge(name)}
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
