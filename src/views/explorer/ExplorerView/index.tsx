import { ExplorerPane } from "../ExplorerPane";
import { useEffect } from "react";
import { useIsConnected } from "~/hooks/connection";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { Group } from "@mantine/core";
import { useExplorerStore } from "~/stores/explorer";

export function ExplorerView() {
	const isOnline = useIsConnected();
	const activeTable = useExplorerStore((s) => s.activeTable);
	const [isCreating, isCreatingHandle] = useDisclosure();

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
					openRecordCreator={isCreatingHandle.open}
				/>
				<ExplorerPane
					openCreator={isCreatingHandle.open}
				/>
			</Group>

			<CreatorDrawer
				opened={isCreating}
				activeTable={activeTable}
				onClose={isCreatingHandle.close}
			/>
		</>
	);
}
