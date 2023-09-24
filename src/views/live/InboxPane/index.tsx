import { ActionIcon } from "@mantine/core";
import { mdiBroadcast, mdiDelete } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { LiveMessage } from "~/types";

export interface InboxPaneProps {
	messages: LiveMessage[];
	onClearAll: () => void;
}

export function InboxPane(props: InboxPaneProps) {
	return (
		<Panel
			title="Inbox"
			icon={mdiBroadcast}
			rightSection={
				<ActionIcon
					title="Clear all"
					onClick={props.onClearAll}
				>
					<Icon color="light.4" path={mdiDelete} />
				</ActionIcon>
			}
		>
			{JSON.stringify(props.messages)}
		</Panel>
	);
}