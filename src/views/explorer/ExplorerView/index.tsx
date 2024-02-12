import { ExplorerPane } from "../ExplorerPane";
import { useEffect } from "react";
import { useHistory } from "~/hooks/history";
import { useExplorerStore } from "~/stores/explorer";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";
import { PanelGroup, Panel } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { TablesPane } from "../TablesPane";

export function ExplorerView() {
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
		<PanelGroup direction="horizontal">
			<Panel minSize={15} defaultSize={15} maxSize={25}>
				<TablesPane />
			</Panel>
			<PanelDragger />
			<Panel minSize={25}>
				<ExplorerPane
					history={history}
					refreshEvent={refreshEvent}
				/>
			</Panel>
		</PanelGroup>
		// <Splitter
		// 	minSize={SPLIT_SIZE}
		// 	bufferSize={495}
		// 	values={splitValues}
		// 	onChange={setSplitValues}
		// 	direction="horizontal"
		// 	startPane={}
		// 	endPane={
		// 		isCreating ? (
		// 			<CreatorPane
		// 				refreshEvent={refreshEvent}
		// 			/>
		// 		) : isEditing ? (
		// 			<InspectorPane
		// 				history={history}
		// 				refreshEvent={refreshEvent}
		// 			/>
		// 		) : null
		// 	}
		// >
		// </Splitter>
	);
}
