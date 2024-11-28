import { Tooltip } from "@mantine/core";
import { ActionIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { openHelpAndSupport } from "~/modals/help-and-support";
import { iconHelp } from "~/util/icons";

export function HelpAndSupport() {
	return (
		<Tooltip label="Help and support">
			<ActionIcon
				w={36}
				h={36}
				radius="md"
				onClick={openHelpAndSupport}
				variant="subtle"
				aria-label="Open Help and support"
			>
				<Icon
					path={iconHelp}
					size="lg"
				/>
			</ActionIcon>
		</Tooltip>
	);
}
