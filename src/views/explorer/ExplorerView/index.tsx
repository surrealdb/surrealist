import { ExplorerPane } from "../ExplorerPane";
import { useEffect, useState } from "react";
import { useHistory } from "~/hooks/history";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { Group } from "@mantine/core";

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
			<Group
				h="100%"
				wrap="nowrap"
				gap="var(--surrealist-divider-size)"
			>
				<TablesPane
					openRecordCreator={openCreator}
				/>
				<ExplorerPane
					refreshEvent={refreshEvent}
					openCreator={isCreatingHandle.open}
				/>
			</Group>

			<CreatorDrawer
				opened={isCreating}
				activeTable={activeTable}
				onClose={isCreatingHandle.close}
				onRefresh={refreshEvent.dispatch}
			/>
		</>
	);
}
