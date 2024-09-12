import { ActionIcon, Tooltip } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsConnected } from "~/hooks/connection";
import { iconAuth, iconPlus } from "~/util/icons";

export function AuthenticationPanel() {
	const isConnected = useIsConnected();
	
	return (
		<ContentPane
			title="Authentication"
			icon={iconAuth}
			rightSection={
				<Tooltip label="New authentication">
					<ActionIcon
						aria-label="Create new authentication"
						disabled={!isConnected}
					>
						<Icon path={iconPlus} />
					</ActionIcon>
				</Tooltip>
			}
		>
			Test
		</ContentPane>
	);
}