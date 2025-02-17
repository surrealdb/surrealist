import classes from "../style.module.scss";

import {
	Box,
	Button,
	Center,
	Checkbox,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Text,
} from "@mantine/core";

import { indexParallelEdgesIndex } from "@sigma/edge-curve";
import { inferSettings } from "graphology-layout-forceatlas2";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import iwanthue, { ColorSpaceArray } from "iwanthue";
import { isArray, isNumber, isObject } from "radash";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Gap, PreparedQuery, RecordId, equals, escapeIdent } from "surrealdb";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { RelationGraph, newRelationalGraph } from "~/components/RelationGraph";
import { NodeCircle } from "~/components/RelationGraph/node";
import { GraphExpansion } from "~/components/RelationGraph/types";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useLater } from "~/hooks/later";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useToggleList } from "~/hooks/toggle";
import { openGraphLabelEditorModal } from "~/modals/graph-labels";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { __throw, plural } from "~/util/helpers";
import { iconBraces, iconFilter, iconRelation, iconTag } from "~/util/icons";
import { themeColor } from "~/util/mantine";
import { type PreviewProps } from ".";
import { useConnectionAndView } from "~/hooks/routing";

const CURVE_AMP = 3.5;
const CURVE_SCALE = 0.15;
const SURREAL_SPACE: ColorSpaceArray = [180, 10, 50, 100, 40, 100];

const WIRE_RECORDS = new Gap<RecordId[]>();
const WIRE_QUERY = new PreparedQuery(
	"SELECT VALUE [in, id, out] FROM array::distinct(array::flatten($records<->(? WHERE out IN $records AND in IN $records))) WHERE __ == true",
	{ records: WIRE_RECORDS },
);

function jitter(value?: number) {
	return value !== undefined ? value + (Math.random() - 0.5) * 0.001 : value;
}

function curvature(index: number, maxIndex: number): number {
	if (index < 0) return -curvature(-index, maxIndex);
	const maxCurvature = CURVE_AMP * (1 - Math.exp(-maxIndex / CURVE_AMP)) * CURVE_SCALE;
	return (maxCurvature * index) / (maxIndex || 1);
}

export function GraphPreview({ responses, selected }: PreviewProps) {
	const { updateConnection } = useConfigStore.getState();
	const [connection] = useConnectionAndView();

	const isLight = useIsLight();
	const supervisorRef = useRef<FA2LayoutSupervisor>();

	const [graphLabels, showStray, straightEdges] = useConnection((c) => [
		c?.graphLabels ?? {},
		c?.graphShowStray ?? false,
		c?.graphStraightEdges ?? false,
	]);

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

	const [hiddenTables, toggleHiddenTable, setHiddenTables] = useToggleList();
	const [hiddenEdges, toggleHiddenEdge, setHiddenEdges] = useToggleList();
	const [tables, setTables] = useState<string[]>([]);
	const [edges, setEdges] = useState<string[]>([]);
	const [colors, setColors] = useState<Map<string, string>>(new Map());
	const [aliases, setAliases] = useState<Map<string, string>>(new Map());

	const { success, result } = responses[selected] ?? { result: null };
	const textSize = Math.floor(15 * (editorScale / 100));
	const disabled = themeColor(isLight ? "slate.2" : "slate.6");

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
		setColors(new Map());
		setAliases(new Map());

		// Add initial nodes
		for (const record of records) {
			const id = record.toString();

			if (!universeGraph.hasNode(id)) {
				universeGraph.addNode(id, {
					record: record,
				});
			}
		}

		// Refresh the visible nodes
		refreshNodes();
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
		const colorMap = new Map<string, string>();
		const palette = iwanthue(9, {
			seed: "surrealist",
			colorSpace: SURREAL_SPACE,
		});

		// Assign previously used colors
		for (const table of tableList) {
			const curr = colors.get(table);

			if (curr) {
				colorMap.set(table, curr);
				palette.splice(palette.indexOf(curr), 1);
			}
		}

		// Assign new colors
		let i = 0;

		for (const table of tableList) {
			if (!colorMap.has(table)) {
				colorMap.set(table, palette[i++ % palette.length]);
			}
		}

		setColors(colorMap);
		setTables(tableList);
		setEdges(edgeList);
	});

	// Relation wiring mutation
	const rewireNodes = useStable(async () => {
		setWiring(true);

		const nodes = universeGraph.nodeEntries();
		const records = Array.from(nodes).map((e) => e.attributes.record);
		const [response] = await executeQuery(WIRE_QUERY, [WIRE_RECORDS.fill(records)]);
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
		setWiring(false);
	});

	// Fetch and apply node labels
	const applyLabels = useStable(async () => {
		const groups = new Map<string, RecordId[]>();
		let labels: Record<string, string> = {};
		let queries = "";

		// Group nodes per table
		for (const node of universeGraph.nodes()) {
			const record = universeGraph.getNodeAttributes(node).record;
			const table = record.tb;

			if (!graphLabels[table]?.length) {
				continue;
			}

			if (!groups.has(table)) {
				groups.set(table, []);
			}

			groups.get(table)?.push(record);
		}

		// Fetch labels if tables are present
		if (groups.size > 0) {
			const iterator = Array.from(groups.entries()).entries();
			const params: Record<string, RecordId[]> = {};

			for (const [index, [table, records]] of iterator) {
				const properties = graphLabels[table] ?? [];

				if (properties.length > 0) {
					const selection = properties.map((p) => escapeIdent(p)).join(" || ");

					queries += `(select value [id, ${selection}] from $tb_${index}),`;
					params[`tb_${index}`] = records;
				}
			}

			const [response] = await executeQuery(
				`object::from_entries(array::flatten([${queries}]))`,
				params,
			);

			labels = response.result;
		}

		// Update universe nodes
		universeGraph.forEachNode((node) => {
			universeGraph.setNodeAttribute(node, "display", labels[node]);
		});
	});

	// Refresh the nodes, including rewiring, applying labels, and synchronizing changes
	const refreshNodes = useStable(async () => {
		await Promise.all([rewireNodes(), applyLabels()]);
		synchronizeGraph();
	});

	// Synchronize the universe graph to display graph
	const synchronizeGraph = useLater(() => {
		const skipTables = new Set(hiddenTables);
		const skipEdges = new Set(hiddenEdges);

		// Append or update nodes
		for (const { node, attributes } of universeGraph.nodeEntries()) {
			if (skipTables.has(attributes.record.tb)) {
				if (displayGraph.hasNode(node)) {
					displayGraph.dropNode(node);
				}

				continue;
			}

			const data = {
				record: attributes.record,
				label: attributes.display || node,
				color: colors.get(attributes.record.tb),
			};

			if (displayGraph.hasNode(node)) {
				displayGraph.mergeNodeAttributes(node, data);
			} else {
				displayGraph.addNode(node, {
					...data,
					x: Math.random(),
					y: Math.random(),
					size: 9,
				});
			}
		}

		// Drop removed nodes
		for (const node of displayGraph.nodes()) {
			if (!universeGraph.hasNode(node)) {
				displayGraph.dropNode(node);
			}
		}

		// Append or update edges
		universeGraph.forEachEdge((edge, attr) => {
			if (skipEdges.has(attr.record.tb)) {
				if (displayGraph.hasEdge(edge)) {
					displayGraph.dropEdge(edge);
				}

				return;
			}

			const src = universeGraph.source(edge);
			const tgt = universeGraph.target(edge);

			if (!displayGraph.hasNode(src) || !displayGraph.hasNode(tgt)) {
				return;
			}

			const data = {
				weight: attr.weight,
				record: attr.record,
				label: attr.record.tb,
				type: straightEdges ? "straight" : "curved",
			};

			if (displayGraph.hasEdge(edge)) {
				displayGraph.mergeEdgeAttributes(edge, data);
			} else {
				displayGraph.addDirectedEdgeWithKey(edge, src, tgt, data);
			}
		});

		// Drop removed edges
		for (const edge of displayGraph.edges()) {
			if (!universeGraph.hasEdge(edge)) {
				displayGraph.dropEdge(edge);
			}
		}

		// Optionally hide stray records
		if (!showStray) {
			for (const node of displayGraph.nodes()) {
				if (displayGraph.degree(node) === 0) {
					displayGraph.dropNode(node);
				}
			}
		}

		// Compute edge curvature
		if (!straightEdges) {
			indexParallelEdgesIndex(displayGraph);

			displayGraph.forEachEdge((edge, { parallelIndex, parallelMaxIndex }) => {
				if (isNumber(parallelIndex) && isNumber(parallelMaxIndex)) {
					displayGraph.setEdgeAttribute(
						edge,
						"curvature",
						curvature(parallelIndex, parallelMaxIndex),
					);
				}
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

			if (!universeGraph.hasNode(id)) {
				universeGraph.addNode(id, {
					record: node,
				});

				displayGraph.addNode(id, {
					record: node,
					x: toJitter ? jitter(x) : x,
					y: toJitter ? jitter(y) : y,
					size: 9,
				});
			}
		}

		// Refresh the visible nodes
		refreshNodes();
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
		if (!connection) return;

		updateConnection({ id: connection, graphShowStray: e.target.checked });
		synchronizeGraph();
	});

	const updateStraightLines = useStable((e: ChangeEvent<HTMLInputElement>) => {
		if (!connection) return;

		updateConnection({ id: connection, graphStraightEdges: e.target.checked });
		synchronizeGraph();
	});

	const handleOpenLabels = useStable(() => {
		openGraphLabelEditorModal(async () => {
			await applyLabels();
			synchronizeGraph();
		});
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
				slowDown: 2000,
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
							p="lg"
							gap="xl"
							flex={1}
						>
							<Box>
								<Label mb="xs">Graph</Label>
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
								<Label>Tables</Label>
								{tables.length === 0 ? (
									<Skeleton visible={isInitialized}>
										<Text c="slate">No tables found</Text>
									</Skeleton>
								) : (
									<Stack
										gap={2}
										mt="xs"
									>
										{tables.map((table) => {
											const isHidden = hiddenTables.includes(table);
											const labels = graphLabels[table]?.length ?? 0;

											return (
												<Button
													key={table}
													p={4}
													ta="start"
													color="slate"
													variant="subtle"
													onClick={() => handleToggleTable(table)}
													className={classes.graphTable}
													styles={{
														label: {
															flex: 1,
														},
													}}
													leftSection={
														<NodeCircle
															size={12}
															color={
																isHidden
																	? disabled
																	: colors.get(table)
															}
														/>
													}
												>
													<Group
														gap="sm"
														w="100%"
														ml="xs"
													>
														<Text
															truncate
															c="bright"
															flex={1}
															opacity={isHidden ? 0.6 : 1}
														>
															{table}
															{labels > 0 && (
																<Text
																	fz="xs"
																	span
																	c="slate"
																	ml={4}
																>
																	{`(${labels} ${plural(labels, "label")})`}
																</Text>
															)}
														</Text>
													</Group>
												</Button>
											);
										})}
									</Stack>
								)}
							</Box>
							<Box>
								<Label>Edges</Label>
								{edges.length === 0 ? (
									<Skeleton visible={isInitialized}>
										<Text c="slate">No edges found</Text>
									</Skeleton>
								) : (
									<Stack
										gap={2}
										mt="xs"
									>
										{edges.map((edge) => {
											const isHidden = hiddenEdges.includes(edge);

											return (
												<Button
													key={edge}
													p={4}
													ta="start"
													color="slate"
													variant="subtle"
													onClick={() => handleToggleEdge(edge)}
													styles={{
														label: {
															flex: 1,
														},
													}}
													leftSection={
														<Icon
															path={iconRelation}
															c={isHidden ? disabled : undefined}
														/>
													}
												>
													<Group
														gap="sm"
														w="100%"
														ml="xs"
													>
														<Text
															flex={1}
															truncate
															c="bright"
															opacity={isHidden ? 0.6 : 1}
														>
															{edge}
														</Text>
													</Group>
												</Button>
											);
										})}
									</Stack>
								)}
							</Box>
							<Box pb="lg">
								<Label>Appearance</Label>
								<Stack
									gap="md"
									mt="md"
								>
									<Checkbox
										ml={4}
										flex={1}
										c="bright"
										label="Stray records"
										checked={showStray}
										onChange={updateShowStray}
									/>
									<Checkbox
										ml={4}
										flex={1}
										c="bright"
										label="Straight edges"
										checked={straightEdges}
										onChange={updateStraightLines}
									/>
									<Button
										color="slate"
										variant="light"
										size="xs"
										mt="md"
										leftSection={<Icon path={iconTag} />}
										onClick={handleOpenLabels}
									>
										Configure labels
									</Button>
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
