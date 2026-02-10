import { Indicator } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useOnboarding } from "~/hooks/onboarding";
import { useStable } from "~/hooks/stable";
import { iconSidekick } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";
import { StarSparkles } from "../StarSparkles";

export function SidekickAction() {
	const [hasExplored, explore] = useOnboarding("sidekick");

	const handleOpen = useStable(() => {
		explore();
		dispatchIntent("open-sidekick");
	});

	return (
		<Indicator disabled={true}>
			<StarSparkles
				inset={10}
				hidden={hasExplored}
			>
				<ActionButton
					w={36}
					h={36}
					radius="md"
					variant="subtle"
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
			</StarSparkles>
		</Indicator>
	);
}
