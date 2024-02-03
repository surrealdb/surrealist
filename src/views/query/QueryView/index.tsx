import { useState } from "react";
import { FavoritesPane } from "../FavoritesPane";
import { HistoryPane } from "../HistoryPane";
import { QueryPane } from "../QueryPane";
import { ResultPane } from "../ResultPane";
import { VariablesPane } from "../../query/VariablesPane";
import { Splitter, SplitValues } from "~/components/Splitter";
import { useConfigStore } from "~/stores/config";

export function QueryView() {
	const enableListing = useConfigStore((s) => s.enableListing);
	const queryListing = useConfigStore((s) => s.queryListing);

	const [splitValues, setSplitValues] = useState<SplitValues>([750, undefined]);
	const [innerSplitValues, setInnerSplitValues] = useState<SplitValues>([undefined, undefined]);

	return (
		<Splitter
			minSize={300}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			bufferSize={520}
			startPane={
				<Splitter
					minSize={120}
					values={innerSplitValues}
					onChange={setInnerSplitValues}
					bufferSize={0}
					direction="vertical"
					endPane={
						<VariablesPane />
					}
				>
					<QueryPane />
				</Splitter>
			}
			endPane={
				enableListing ? (
					queryListing == "history" ? (
						<HistoryPane />
					) : (
						<FavoritesPane />
					)
				) : null
			}>
			<ResultPane />
		</Splitter>
	);
}
