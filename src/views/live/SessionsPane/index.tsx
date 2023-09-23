import { ActionIcon } from "@mantine/core";
import { mdiBullhornVariant, mdiCancel } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";

export function SessionsPane() {
	return (
		<Panel
			title="Sessions"
			icon={mdiBullhornVariant}
			rightSection={
				<ActionIcon title="Cancel all">
					<Icon color="light.4" path={mdiCancel} />
				</ActionIcon>
			}
		>
			
		</Panel>
	);
}