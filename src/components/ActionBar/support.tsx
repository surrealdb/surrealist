import { Icon } from "~/components/Icon";
import { openHelpAndSupport } from "~/modals/help-and-support";
import { iconHelp } from "~/util/icons";
import { ActionButton } from "../ActionButton";

export function HelpAndSupport() {
	return (
		<ActionButton
			w={36}
			h={36}
			radius="md"
			variant="subtle"
			label="Help and support"
			tooltipProps={{
				position: "bottom",
				label: "Help and support",
				children: null,
			}}
			onClick={openHelpAndSupport}
		>
			<Icon
				path={iconHelp}
				size="lg"
			/>
		</ActionButton>
	);
}
