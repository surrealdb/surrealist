import { ExplorerPane } from "../ExplorerPane";
import { TablesPane } from "../TablesPane";
import { useEffect, useState } from "react";
import { InspectorPane } from "../InspectorPane";
import { SplitValues, Splitter } from "~/components/Splitter";
import { CreatorPane } from "../CreatorPane";
import { useHistory } from "~/hooks/history";
import { useExplorerStore } from "~/stores/explorer";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";

const SPLIT_SIZE: SplitValues = [200, 308];

export function ExplorerView() {
	const [splitValues, setSplitValues] = useState<SplitValues>([250, 450]);
	const isOnline = useIsConnected();
	const refreshEvent = useEventBus();

	const closeEditor = useExplorerStore((s) => s.closeEditor);
	const setHistory = useExplorerStore((s) => s.setHistory);
	const isEditing = useExplorerStore((s) => s.isEditing);
	const isCreating = useExplorerStore((s) => s.isCreating);
	const recordHistory = useExplorerStore((s) => s.recordHistory);
	
	const history = useHistory({
		history: recordHistory,
		setHistory: (items) => setHistory(items)
	});

	useEffect(() => {
		if (!isOnline) {
			closeEditor();
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
