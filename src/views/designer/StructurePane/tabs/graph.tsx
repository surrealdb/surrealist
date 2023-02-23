import { useMantineTheme } from "@mantine/core";
import Graph from "graphology";
import { useRef, useEffect } from "react";
import Sigma from "sigma";
import { useStoreValue } from "~/store";
import { SchemaTabProps } from "./helpers";

export function GraphTab(props: SchemaTabProps) {
	const tables = useStoreValue(state => state.tables);
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);
	const theme = useMantineTheme();

	// const fetchInfer = useStable(async () => {
	// 	const surreal = getSurreal();

	// 	if (!props.isOnline || !surreal) {
	// 		return;
	// 	}

	// 	const tables = await fetchTables(surreal);
	// 	const graph = new MultiDirectedGraph();
	// 	const queries = tables.reduce((acc, table) => {
	// 		return acc + `(SELECT id, in, out, meta::table(id) AS tb FROM ${table} LIMIT ${recordLimit}),`;
	// 	}, '');

	// 	const records = await surreal.query('SELECT * FROM array::flatten([' + queries + '])');
	// 	const colors = shuffle(COLORS);

	// 	let colorMap: Record<string, number> = {};
	// 	let colorNum = 0;

	// 	for (const record of records[0].result) {
	// 		if (!record.in && !record.out) {
	// 			if (!colorMap[record.tb]) {
	// 				colorMap[record.tb] = colorNum;
	// 				colorNum = (colorNum + 1) % colors.length;
	// 			}

	// 			graph.addNode(record.id, {
	// 				label: record.id,
	// 				size: 3.5,
	// 				color: colors[colorMap[record.tb]]
	// 			});
	// 		}
	// 	}

	// 	for (const record of records[0].result) {
	// 		if (record.in && record.out) {
	// 			try {
	// 				graph.addEdgeWithKey(record.id, record.in, record.out, { label: record.id });
	// 			} catch(err) {
	// 				// ignore
	// 			}
	// 		}
	// 	}

	// 	random.assign(graph);
	// 	forceAtlas2.assign(graph, 100);

	// 	setGraph(graph);
	// });

	useEffect(() => {

	}, [tables]);
	
	useEffect(() => {
		const instance = new Sigma(new Graph(), ref.current!, {
			allowInvalidContainer: true,
			labelColor: {
				color: 'white',
				attribute: 'background-color'
			},
			defaultNodeColor: theme.colors.surreal[5]
		});

		sigma.current = instance;
	}, []);

	return (
		<div ref={ref} style={{ width: '100%', height: '100%' }} />
	)
}