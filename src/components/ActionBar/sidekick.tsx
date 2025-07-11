import { Indicator } from "@mantine/core";
import { ActionButton } from "../ActionButton";
import { dispatchIntent } from "~/util/intents";
import { Icon } from "../Icon";
import { iconSidekick } from "~/util/icons";

export function SidekickAction() {
	return (
		<Indicator disabled={true}>
			<ActionButton
				w={36}
				h={36}
				radius="md"
				variant="subtle"
				label="Sidekick AI"
				onClick={() => dispatchIntent("open-sidekick")}
			>
				<Icon
					path={iconSidekick}
					size="lg"
				/>
			</ActionButton>
		</Indicator>
	);
}
