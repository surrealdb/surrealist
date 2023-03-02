import ForceSupervisor from "graphology-layout-force/worker";
import Graph, { MultiDirectedGraph } from "graphology";
import { useEffect, useMemo, useRef, useState } from "react";
import { Splitter } from "~/components/Splitter";
import { GraphPane } from "../GraphPane";
import { useStoreValue } from "~/store";
import { extractEdgeRecords } from "~/util/schema";
import { OptionsPane } from "../OptionsPane";
import Sigma from "sigma";
import { useStable } from "~/hooks/stable";

export interface VisualizerViewProps {
	isOnline: boolean;
}

export function VisualizerView(props: VisualizerViewProps) {
	const layoutRef = useRef<any>(null);
	const schema = useStoreValue(state => state.databaseSchema);
	const sigmaRef = useRef<Sigma | null>(null);
	const [graph, setGraph] = useState<MultiDirectedGraph | null>(null);

	const saveSigma = useStable((sigma: Sigma) => {
		sigmaRef.current = sigma;
	});

	const spreadNodes = useStable((graph: Graph) => {
		graph.nodes().forEach((node, i) => {
			const angle = (i * 2 * Math.PI) / graph.order;

			graph.setNodeAttribute(node, "x", 100 * Math.cos(angle));
			graph.setNodeAttribute(node, "y", 100 * Math.sin(angle));
		});

		const layout = new ForceSupervisor(graph, {
			settings: {
				
			}
		});
		
		layout.start();

		layoutRef.current?.kill();
		layoutRef.current = layout;
	})

	const refreshGraph = useStable(() => {
		const graph = new MultiDirectedGraph();
		const data = schema.map(table => [
			table.schema.name,
			...extractEdgeRecords(table)
		] as const);

		// 1st pass: place all tables into the graph
		for (const [tableName, isEdge] of data) {
			if (!isEdge) {
				graph.addNode(tableName, {
					label: tableName,
					size: 12
				});
			}
		}

		// 2nd pass: place all edges into the graph
		for (const [tableName, isEdge, inTables, outTables] of data) {
			if (isEdge) {
				for (const inTable of inTables) {
					for (const outTable of outTables) {
						try {
							const existing = graph.edges(inTable, outTable)[0];

							if (existing) {
								const label = graph.getEdgeAttribute(existing, 'label');
								const condensed = graph.getEdgeAttribute(existing, 'condensed');
	
								if (condensed) {
									continue;
								}
	
								graph.setEdgeAttribute(existing, 'label', `${label} & more`);
								graph.setEdgeAttribute(existing, 'condensed', true);
								graph.setEdgeAttribute(existing, 'type', 'line');
							} else {
								graph.addDirectedEdgeWithKey(tableName, inTable, outTable, {
									label: tableName,
									type: 'arrow',
									size: 3
								});
							}
						} catch(_) {
							console.warn('Skipping edge', tableName, 'from', inTable, 'to', outTable);
						}
					}
				}
			}
		}

		setGraph(graph);

		if (sigmaRef.current) {
			spreadNodes(graph);
		}
	});

	useEffect(() => {
		return () => {
			layoutRef.current?.kill();
		}
	}, []);

	return (
		<Splitter
			minSize={[undefined, 325]}
			bufferSize={500}
			direction="horizontal"
			endPane={
				<OptionsPane
					isOnline={props.isOnline}
					onGenerate={refreshGraph}
				/>
			}
		>
			<GraphPane
				isOnline={props.isOnline}
				graph={graph}
				onCreated={saveSigma}
			/>
		</Splitter>
	);
}