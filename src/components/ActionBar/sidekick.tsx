import { Indicator } from "@mantine/core";
import { Icon, iconSidekick } from "@surrealdb/ui";
import { useOnboarding } from "~/hooks/onboarding";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";

export function SidekickAction() {
	const [_hasExplored, explore] = useOnboarding("sidekick");

	const handleOpen = useStable(() => {
		explore();
		dispatchIntent("open-sidekick");
	});

	return (
		<Indicator disabled={true}>
			<ActionButton
				label="Sidekick AI"
				tooltipProps={{
					position: "bottom",
					label: "Sidekick AI",
					children: null,
				}}
				onClick={handleOpen}
			>
				<Icon
					path={iconSidekick}
					size="lg"
				/>
			</ActionButton>
		</Indicator>
	);
}
