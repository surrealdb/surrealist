import { ExplorerPane } from "../ExplorerPane";
import { useEffect } from "react";
import { useIsConnected } from "~/hooks/connection";
import { useEventBus } from "~/hooks/event";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { useStable } from "~/hooks/stable";
import { Group } from "@mantine/core";
import { useExplorerStore } from "~/stores/explorer";

export function ExplorerView() {
	const isOnline = useIsConnected();
	const refreshEvent = useEventBus();
	const activeTable = useExplorerStore((s) => s.activeTable);

	const [isCreating, isCreatingHandle] = useDisclosure();

	const openCreator = useStable((table?: string) => {
		isCreatingHandle.open();
	});

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
