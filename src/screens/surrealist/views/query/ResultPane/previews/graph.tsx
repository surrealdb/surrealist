import classes from "../style.module.scss";

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

import { indexParallelEdgesIndex } from "@sigma/edge-curve";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { isArray, isNumber, isObject } from "radash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Gap, PreparedQuery, RecordId, equals } from "surrealdb";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { RelationGraph, newRelationalGraph } from "~/components/RelationGraph";
import { NodeCircle } from "~/components/RelationGraph/node";
import { GraphExpansion } from "~/components/RelationGraph/types";
import { useSetting } from "~/hooks/config";
import { useLater } from "~/hooks/later";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useToggleList } from "~/hooks/toggle";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { __throw } from "~/util/helpers";
import { iconBraces, iconFilter, iconRelation } from "~/util/icons";
import { type PreviewProps } from ".";

const CURVE_AMP = 3.5;
const CURVE_SCALE = 0.15;
const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];
const RECORDS = new Gap<RecordId[]>();
const QUERY = new PreparedQuery(
	"SELECT VALUE [in, id, out] FROM $records<->(? WHERE out IN $records AND in IN $records).flatten() WHERE __ == true",
	{ records: RECORDS },
);

function jitter(value?: number) {
	return value !== undefined ? value + Math.random() * 0.000001 : value;
}

function curvature(index: number, maxIndex: number): number {
	if (index < 0) return -curvature(-index, maxIndex);
	const maxCurvature = CURVE_AMP * (1 - Math.exp(-maxIndex / CURVE_AMP)) * CURVE_SCALE;
	return (maxCurvature * index) / (maxIndex || 1);
}

export function GraphPreview({ responses, selected }: PreviewProps) {
	const isLight = useIsLight();
	const supervisorRef = useRef<FA2LayoutSupervisor>();
	const [editorScale] = useSetting("appearance", "editorScale");
	const [isInitialized, setInitializing] = useState(true);
	const [isWiring, setWiring] = useState(true);
	const [universeGraph] = useState(() => newRelationalGraph());
	const [displayGraph] = useState(() => newRelationalGraph());
	const [supervising, setSupervising] = useState(true);

	const [isEmpty, setEmpty] = useState(false);
	const [strayCount, setStrayCount] = useState(0);
	const [nodeCount, setNodeCount] = useState(0);
	const [edgeCount, setEdgeCount] = useState(0);

	const [showStray, setShowStray] = useState(false);
	const [straightLines, setStraightLines] = useState(false);
	const [hiddenTables, toggleHiddenTable, setHiddenTables] = useToggleList();
	const [hiddenEdges, toggleHiddenEdge, setHiddenEdges] = useToggleList();
	const [tables, setTables] = useState<string[]>([]);
	const [edges, setEdges] = useState<string[]>([]);
	const [colors, setColors] = useState<Map<string, string>>(new Map());

	const { success, result } = responses[selected] ?? { result: null };
	const textSize = Math.floor(15 * (editorScale / 100));

	// Refresh the graph based on the query result
	const refreshGraph = useStable(async (result: any) => {
		setInitializing(true);

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

		// Reset the graphs
		universeGraph.clear();
		displayGraph.clear();

		// Reset visibility
		setHiddenEdges([]);
		setHiddenTables([]);

		// Add initial nodes
		for (const record of records) {
			const id = record.toString();

			if (!universeGraph.hasNode(id)) {
				universeGraph.addNode(id, {
					record: record,
				});
			}
		}

		// Fetch node relations
		rewireNodes();
	});

	// Compute graph statistics
	const computeStatistics = useStable(() => {
		const nodeCount = displayGraph.nodes().length;
		const edgeCount = displayGraph.edges().length;
		const strayCount = displayGraph.nodes().filter((n) => displayGraph.degree(n) === 0).length;

		setNodeCount(nodeCount);
		setEdgeCount(edgeCount);
		setStrayCount(strayCount);
	});

	// Index graph metadata
	const indexMetadata = useStable(() => {
		const tables = new Set<string>();
		const edges = new Set<string>();

		universeGraph.forEachNode((_, attr) => {
			tables.add(attr.record.tb);
		});

		universeGraph.forEachEdge((_, attr) => {
			edges.add(attr.record.tb);
		});

		const tableList = Array.from(tables).sort();
		const edgeList = Array.from(edges).sort();
		const paletteSize = Math.max(tableList.length, 1);
		const palette = iwanthue(paletteSize, {
			seed: "surrealist",
			colorSpace: SURREAL_SPACE,
		});

		const colorMap = new Map<string, string>();

		for (const [i, table] of tableList.entries()) {
			colorMap.set(table, palette[i]);
		}

		setColors(colorMap);
		setTables(tableList);
		setEdges(edgeList);
	});

	// Relation wiring mutation
	const rewireNodes = useLater(async () => {
		setWiring(true);

		const nodes = universeGraph.nodeEntries();
		const records = Array.from(nodes).map((e) => e.attributes.record);
		const [response] = await executeQuery(QUERY, [RECORDS.fill(records)]);
		const relations = response.result as [RecordId, RecordId, RecordId][];

		universeGraph.clearEdges();

		for (const [source, edge, target] of relations) {
			const id = edge.toString();
			const src = source.toString();
			const tgt = target.toString();

			if (
				!equals(source, target) &&
				!universeGraph.hasEdge(id) &&
				universeGraph.hasNode(src) &&
				universeGraph.hasNode(tgt)
			) {
				universeGraph.addDirectedEdgeWithKey(id, src, tgt, {
					weight: source.tb === target.tb ? 2 : 1,
					record: edge,
				});
			}
		}

		indexMetadata();
		synchronizeGraph();
		setWiring(false);
	});

	// Synchronize the universe graph to display graph
	const synchronizeGraph = useLater(() => {
		const positions = new Map<string, [number, number]>();

		displayGraph.forEachNode((node, attr) => {
			positions.set(node, [attr.x || 0, attr.y || 0]);
		});

		// Clear the display graph
		displayGraph.clear();

		const skipTables = new Set(hiddenTables);
		const skipEdges = new Set(hiddenEdges);

		// Synchronize nodes
		universeGraph.forEachNode((node, attr) => {
			if (skipTables.has(attr.record.tb)) {
				return;
			}

			const [x, y] = positions.get(node) ?? [Math.random(), Math.random()];

			displayGraph.addNode(node, {
				x,
				y,
				record: attr.record,
				label: node,
				size: 9,
				color: colors.get(attr.record.tb),
			});
		});

		// Synchronize edges
		universeGraph.forEachEdge((edge, attr) => {
			if (skipEdges.has(attr.record.tb)) {
				return;
			}

			const src = universeGraph.source(edge);
			const tgt = universeGraph.target(edge);

			if (displayGraph.hasNode(src) && displayGraph.hasNode(tgt)) {
				displayGraph.addDirectedEdgeWithKey(edge, src, tgt, {
					weight: attr.weight,
					record: attr.record,
					label: attr.record.tb,
					type: straightLines ? "straight" : "curved",
				});
			}
		});

		// Optionally hide stray records
		if (!showStray) {
			for (const node of displayGraph.nodes()) {
				if (displayGraph.degree(node) === 0) {
					displayGraph.dropNode(node);
				}
			}
		}

		// Compute edge curvature
		if (!straightLines) {
			indexParallelEdgesIndex(displayGraph);

			displayGraph.forEachEdge((edge, { parallelIndex, parallelMaxIndex }) => {
				if (!isNumber(parallelIndex) || !isNumber(parallelMaxIndex)) return;

				const curve = curvature(parallelIndex, parallelMaxIndex);

				displayGraph.mergeEdgeAttributes(edge, {
					type: curve === 0 ? "straight" : "curved",
					curvature: curve,
				});
			});
		}

		computeStatistics();
		setEmpty(displayGraph.order === 0);
		setInitializing(false);
	});

	const toggleSupervising = useStable(() => {
		const supervisor = supervisorRef.current;

		setSupervising((value) => {
			if (value) {
				supervisor?.stop();
			} else {
				supervisor?.start();
			}

			return !value;
		});
	});

	const handleHideNode = useStable((node: RecordId) => {
		displayGraph.dropNode(node.toString());
		setEmpty(displayGraph.order === 0);
		computeStatistics();
	});

	const handleExpand = useStable(async ({ record, direction, edges }: GraphExpansion) => {
		const query = `SELECT VALUE id FROM $current${direction}(${edges.join(",")})${direction}?`;

		const { x, y } = displayGraph.getNodeAttributes(record.toString());
		const [response] = await executeQuery(query, { current: record });
		const result = response.result as RecordId[];
		const expandables = result.filter((r) => !universeGraph.hasNode(r.toString()));
		const toJitter = expandables.length > 1;

		for (const node of expandables) {
			const id = node.toString();

			universeGraph.addNode(id, {
				record: node,
			});

			const m = {
				record: node,
				x: toJitter ? jitter(x) : x,
				y: toJitter ? jitter(y) : y,
			};

			displayGraph.addNode(id, m);
		}

		rewireNodes();
	});

	const handleQueryEdges = useStable((record: RecordId) => {
		const node = record.toString();
		const inEdges = universeGraph.inEdges(node);
		const outEdges = universeGraph.outEdges(node);

		return {
			from: new Set(inEdges.map((e) => universeGraph.getEdgeAttributes(e).record.tb)),
			to: new Set(outEdges.map((e) => universeGraph.getEdgeAttributes(e).record.tb)),
		};
	});

	const handleReset = useStable(() => {
		refreshGraph(result);
	});

	const handleToggleTable = useStable((table: string) => {
		toggleHiddenTable(table);
		synchronizeGraph();
	});

	const handleToggleEdge = useStable((edge: string) => {
		toggleHiddenEdge(edge);
		synchronizeGraph();
	});

	const updateShowStray = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setShowStray(e.target.checked);
		synchronizeGraph();
	});

	const updateStraightLines = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setStraightLines(e.target.checked);
		synchronizeGraph();
	});

	// Construct the graph
	useEffect(() => {
		refreshGraph(result);
	}, [result]);

	// Apply layout supervisor
	useEffect(() => {
		const supervisor = new FA2LayoutSupervisor(displayGraph, {
			getEdgeWeight: "weight",
			settings: {
				...inferSettings(displayGraph),
				edgeWeightInfluence: 1,
				scalingRatio: 2,
				slowDown: 500,
			},
		});

		supervisor.start();
		supervisorRef.current = supervisor;

		return () => {
			supervisor.kill();
		};
	}, [displayGraph]);

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
				{isInitialized ? (
					<Center flex={1}>
						<Loader />
					</Center>
				) : displayGraph ? (
					<RelationGraph
						graph={displayGraph}
						controlOffsetTop={12}
						isSupervising={supervising}
						isWiring={isWiring}
						isEmpty={isEmpty}
						queryEdges={handleQueryEdges}
						onToggleSupervising={toggleSupervising}
						onHideNode={handleHideNode}
						onExpandNode={handleExpand}
						onReset={handleReset}
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
						className={classes.graphSidebar}
						inset={0}
					>
						<Stack
							gap="xl"
							p="lg"
							flex={1}
							h="100%"
						>
							<Box>
								<Label mb="xs">Statistics</Label>
								<Stack gap="xs">
									<Skeleton visible={isInitialized}>
										<Group gap="xs">
											<Icon
												path={iconBraces}
												color="slate.4"
												size="sm"
											/>
											{nodeCount.toString()} records
										</Group>
									</Skeleton>
									<Skeleton visible={isInitialized}>
										<Group gap="xs">
											<Icon
												path={iconRelation}
												color="slate.4"
												size="sm"
											/>
											{edgeCount.toString()} edges
										</Group>
									</Skeleton>
									<Skeleton visible={isInitialized}>
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
									{isInitialized ? (
										<>
											<Skeleton h={18} />
											<Skeleton h={18} />
											<Skeleton h={18} />
										</>
									) : (
										<>
											{tables.map((table) => {
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
															onChange={() =>
																handleToggleTable(table)
															}
														/>
														{!isHidden && (
															<NodeCircle
																color={colors.get(table)}
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
									{isInitialized ? (
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
														onChange={() => handleToggleEdge(edge)}
													/>
												</Group>
											))}
										</>
									)}
								</Stack>
							</Box>
							<Box>
								<Label mb="xs">Options</Label>
								<Stack gap="xs">
									<Checkbox
										size="xs"
										label="Show stray records"
										flex={1}
										checked={showStray}
										onChange={updateShowStray}
									/>
									<Checkbox
										size="xs"
										label="Straight edges"
										flex={1}
										checked={straightLines}
										onChange={updateStraightLines}
									/>
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
