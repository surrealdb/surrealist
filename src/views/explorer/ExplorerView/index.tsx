import { ExplorerPane } from "../ExplorerPane";
import { useState } from "react";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { Group } from "@mantine/core";
import { DisconnectedEvent } from "~/util/global-events";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";

export function ExplorerView() {
	const [activeTable, setActiveTable] = useState<string>();
	const [isCreating, isCreatingHandle] = useDisclosure();
	const [creatorTable, setCreatorTable] = useState<string>();

	const openCreator = useStable((table?: string) => {
		setCreatorTable(table || activeTable);
		isCreatingHandle.open();
	});

	useEventSubscription(DisconnectedEvent, () => {
		isCreatingHandle.close();
	});

	useIntent("explore-table", ({ table }) => {
		setActiveTable(table);
	});

	return (
		<>
			<Group
				h="100%"
				wrap="nowrap"
				gap="var(--surrealist-divider-size)"
			>
				<TablesPane
					activeTable={activeTable}
					onTableSelect={setActiveTable}
					onCreateRecord={openCreator}
				/>
				<ExplorerPane
					activeTable={activeTable}
					onCreateRecord={openCreator}
				/>
			</Group>

			{creatorTable && (
				<CreatorDrawer
					opened={isCreating}
					table={creatorTable}
					onClose={isCreatingHandle.close}
				/>
			)}
		</>
	);
}
