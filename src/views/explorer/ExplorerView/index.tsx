import { ExplorerPane } from "../ExplorerPane";
import { useEffect, useState } from "react";
import { useHistory } from "~/hooks/history";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";
import { PanelGroup, Panel } from "react-resizable-panels";
import { PanelDragger } from "~/components/Pane/dragger";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";

export function ExplorerView() {
	const isOnline = useIsConnected();
	const refreshEvent = useEventBus();

	const [isCreating, isCreatingHandle] = useDisclosure();
	const [activeTable, setActiveTable] = useState<string | null>(null);

	const openCreator = useStable((table?: string) => {
		isCreatingHandle.open();
	});
	
	const [history, setHistory] = useState<string[]>([]);
	const inspectHistory = useHistory({ history, setHistory });

	useEffect(() => {
		if (!isOnline) {
			isCreatingHandle.close();
		}
	}, [isOnline]);

	return (
		<>
			<PanelGroup direction="horizontal">
				<Panel minSize={15} defaultSize={18} maxSize={25}>
					<TablesPane
						openRecordCreator={openCreator}
					/>
				</Panel>
				<PanelDragger />
				<Panel minSize={25}>
					<ExplorerPane
						refreshEvent={refreshEvent}
						openCreator={isCreatingHandle.open}
					/>
				</Panel>
			</PanelGroup>
			
			<CreatorDrawer
				opened={isCreating}
				activeTable={activeTable}
				onClose={isCreatingHandle.close}
				onRefresh={refreshEvent.dispatch}
			/>
		</>
	);
}
