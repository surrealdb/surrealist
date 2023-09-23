import { ActionIcon } from "@mantine/core";
import { mdiBroadcast, mdiDelete } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";

export function InboxPane() {
	return (
		<Panel
			title="Inbox"
			icon={mdiBroadcast}
			rightSection={
				<ActionIcon title="Clear all">
					<Icon color="light.4" path={mdiDelete} />
				</ActionIcon>
			}
		>
			
		</Panel>
	);
}