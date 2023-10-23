import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { useEffect, useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { SplitValues, Splitter } from "~/components/Splitter";
import { CreatorPane } from "../CreatorPane";
import { useHistory } from "~/hooks/history";
import { store, useStoreValue } from "~/store";
import { closeEditor, setHistory } from "~/stores/explorer";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";

const SPLIT_SIZE: SplitValues = [200, 300];

export function ExplorerView() {
	const [splitValues, setSplitValues] = useState<SplitValues>([250, 450]);
	const isOnline = useIsConnected();
	const refreshEvent = useEventBus();

	const {
		isEditing,
		isCreating,
		recordHistory,
	} = useStoreValue(state => state.explorer);
	
	const history = useHistory({
		history: recordHistory,
		setHistory: (items) => store.dispatch(setHistory(items))
	});

	useEffect(() => {
		if (!isOnline) {
			store.dispatch(closeEditor());
		}
	}, [isOnline]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={495}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			startPane={<TablesPane />}
			endPane={
				isCreating ? (
					<CreatorPane
						refreshEvent={refreshEvent}
					/>
				) : isEditing ? (
					<InspectorPane
						history={history}
						refreshEvent={refreshEvent}
					/>
				) : null
			}
		>
			<ExplorerPane
				history={history}
				refreshEvent={refreshEvent}
			/>
		</Splitter>
	);
}
