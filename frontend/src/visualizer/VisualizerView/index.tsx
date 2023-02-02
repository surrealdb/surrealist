import { useEffect, useState } from "react";
import { Splitter } from "~/components/Splitter";
import { useStable } from "~/hooks/stable";
import { getSurreal, SurrealHandle } from "~/surreal";
import { SourceMode } from "~/typings";
import { GraphPane } from "../GraphPane";
import { OptionsPane } from "../OptionsPane";

export interface ExplorerViewProps {
	isOnline: boolean;
}

export function VisualizerView(props: ExplorerViewProps) {
	const [sourceMode, setSourceMode] = useState<SourceMode>('infer');


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

		let query = '';

		for (const table of tables) {
			query += `SELECT meta::table(id) AS table, meta::table(in) AS in, meta::table(out) AS out FROM ${table} LIMIT 1;`;
		}

		const samples = await surreal.query(query);

		console.log(samples.map((s: any) => s.result[0]));
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
			<GraphPane />
		</Splitter>
	);
}