import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { useEffect, useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { SplitValues, Splitter } from "~/components/Splitter";
import { CreatorPane } from "../CreatorPane";
import { useHistory } from "~/hooks/history";
import { store, useStoreValue } from "~/store";
import { closeEditor, setHistory, setHistoryIndex } from "~/stores/explorer";
import { useIsConnected } from "~/hooks/connection";

const SPLIT_SIZE: SplitValues = [250, 450];

export function ExplorerView() {
	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);
	const isOnline = useIsConnected();

	const {
		isEditing,
		isCreating,
		recordHistory,
		historyIndex,
	} = useStoreValue(state => state.explorer);
	
	const history = useHistory({
		history: recordHistory,
		index: historyIndex,
		setHistory: (items) => store.dispatch(setHistory(items)),
		setIndex: (index) => store.dispatch(setHistoryIndex(index))
	});

	useEffect(() => {
		if (!isOnline) {
			store.dispatch(closeEditor());
		}
	}, [isOnline]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			startPane={<TablesPane />}
			endPane={
				isCreating ? (
					<CreatorPane />
				) : isEditing ? (
					<InspectorPane history={history} />
				) : null
			}
		>
			<ExplorerPane
				history={history}
			/>
		</Splitter>
	);
}
