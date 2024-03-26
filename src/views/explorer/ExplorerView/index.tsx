import { ExplorerPane } from "../ExplorerPane";
import { useState } from "react";
import { TablesPane } from "../TablesPane";
import { CreatorDrawer } from "../CreatorDrawer";
import { useDisclosure } from "@mantine/hooks";
import { Button, Center, Group, Stack } from "@mantine/core";
import { DisconnectedEvent } from "~/util/global-events";
import { useEventSubscription } from "~/hooks/event";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { Icon } from "~/components/Icon";
import { iconExplorer, iconPlus } from "~/util/icons";
import { useInterfaceStore } from "~/stores/interface";

export function ExplorerView() {
	const { openTableCreator } = useInterfaceStore.getState();

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
				{activeTable ? (
					<ExplorerPane
						activeTable={activeTable}
						onCreateRecord={openCreator}
					/>
				) : (
					<Center flex={1}>
						<Stack
							align="center"
							justify="center"
						>
							<Icon path={iconExplorer} size={2.5} />
							Select a table to view or edit
							<Group>
								<Button
									variant="light"
									leftSection={<Icon path={iconPlus} />}
									onClick={openTableCreator}
								>
									Create table
								</Button>
							</Group>
						</Stack>
					</Center>
				)}
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
