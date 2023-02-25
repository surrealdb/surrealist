// import { useMantineTheme } from "@mantine/core";
// import Graph, { MultiDirectedGraph } from "graphology";
// import { random } from "graphology-layout";
// import forceAtlas2 from "graphology-layout-forceatlas2";
// import { useRef, useEffect } from "react";
// import Sigma from "sigma";
// import { useStoreValue } from "~/store";
// import { TableDefinition } from "~/typings";

// function findEdge(table: TableDefinition) {
// 	let inField: string | null = null;
// 	let outField: string | null = null;

// 	for (const field of table.fields) {
// 		if (field.name)

// 	return [ inField, outField ];
// }

// export function GraphTab() {
// 	const schema = useStoreValue(state => state.databaseSchema);
// 	const ref = useRef<HTMLDivElement>(null);
// 	const sigma = useRef<Sigma | null>(null);
// 	const theme = useMantineTheme();

// 	useEffect(() => {
// 		const graph = new MultiDirectedGraph();

// 		for (const table of schema) {
// 			table.fields
// 			if (!record.in && !record.out) {
// 				graph.addNode(record.id, {
// 					label: record.id,
// 					size: 3.5,
// 					color: colors[colorMap[record.tb]]
// 				});
// 			}
// 		}

// 		for (const record of records[0].result) {
// 			if (record.in && record.out) {
// 				try {
// 					graph.addEdgeWithKey(record.id, record.in, record.out, { label: record.id });
// 				} catch(err) {
// 					// ignore
// 				}
// 			}
// 		}

// 		random.assign(graph);
// 		forceAtlas2.assign(graph, 100);

// 		if (!sigma.current) {
// 			const instance = new Sigma(new Graph(), ref.current!, {
// 				allowInvalidContainer: true,
// 				labelColor: {
// 					color: 'white',
// 					attribute: 'background-color'
// 				},
// 				defaultNodeColor: theme.colors.surreal[5]
// 			});
	
// 			sigma.current = instance;
// 		}

// 		setGraph(graph);
// 	}, [schema]);

// 	return (
// 		<div ref={ref} style={{ width: '100%', height: '100%' }} />
// 	)
// }

export {};