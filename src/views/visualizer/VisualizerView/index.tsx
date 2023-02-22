import Graph, { MultiDirectedGraph } from "graphology";
import { shuffle } from "radash";
import { useState } from "react";
import { Splitter } from "~/components/Splitter";
import { useStable } from "~/hooks/stable";
import { getSurreal, SurrealHandle } from "~/surreal";
import { SourceMode } from "~/typings";
import { GraphPane } from "../GraphPane";
import { OptionsPane } from "../OptionsPane";
import { random } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';

const COLORS = [
	'#1abc9c',
	'#2ecc71',
	'#3498db',
	'#9b59b6',
	'#e74c3c',
	'#e67e22',
	'#f1c40f',
	'#34495e',
	'#5f27cd',
	'#4a69bd'
];

export interface VisualizerViewProps {
	isOnline: boolean;
}

export function VisualizerView(props: VisualizerViewProps) {
	const [sourceMode, setSourceMode] = useState<SourceMode>('infer');
	const [recordLimit, setRecordLimit] = useState(5000);
	const [graph, setGraph] = useState<Graph | null>(null);
	
	const fetchTables = useStable(async (surreal: SurrealHandle) => {
		const response = await surreal.query('INFO FOR DB');
		const result = response[0].result;
		
		return Object.keys(result.tb);
	});

	const fetchInfer = useStable(async () => {
		const surreal = getSurreal();

		if (!props.isOnline || !surreal) {
			return;
		}

		const tables = await fetchTables(surreal);
		const graph = new MultiDirectedGraph();
		const queries = tables.reduce((acc, table) => {
			return acc + `(SELECT id, in, out, meta::table(id) AS tb FROM ${table} LIMIT ${recordLimit}),`;
		}, '');

		const records = await surreal.query('SELECT * FROM array::flatten([' + queries + '])');
		const colors = shuffle(COLORS);

		console.log(records);

		let colorMap: Record<string, number> = {};
		let colorNum = 0;

		for (const record of records[0].result) {
			if (!record.in && !record.out) {
				console.log(record.tb);

				if (!colorMap[record.tb]) {
					colorMap[record.tb] = colorNum;
					colorNum = (colorNum + 1) % colors.length;
				}

				graph.addNode(record.id, {
					label: record.id,
					size: 3.5,
					color: colors[colorMap[record.tb]]
				});
			}
		}

		for (const record of records[0].result) {
			if (record.in && record.out) {
				try {
					graph.addEdgeWithKey(record.id, record.in, record.out, { label: record.id });
				} catch(err) {
					// ignore
				}
			}
		}

		random.assign(graph);
		forceAtlas2.assign(graph, 100);

		setGraph(graph);
	});

	const handleGenerate = useStable(() => {
		if (sourceMode === 'infer') {
			fetchInfer();
		} else {
			fetchInfer();
		}
	});

	return (
		<Splitter
			minSize={[undefined, 325]}
			bufferSize={500}
			direction="horizontal"
			endPane={
				<OptionsPane
					sourceMode={sourceMode}
					setSourceMode={setSourceMode}
					onGenerate={handleGenerate}
				/>
			}
		>
			<GraphPane
				graph={graph}
			/>
		</Splitter>
	);
}