import { Icon, iconSidekick } from "@surrealdb/ui";
import { useStable } from "~/hooks/stable";
import { dispatchIntent } from "~/util/intents";
import { ActionButton } from "../ActionButton";

export function AiIntegrationsAction() {
	const handleOpen = useStable(() => {
		dispatchIntent("open-ai-integrations");
	});

	return (
		<ActionButton
			label="AI integrations"
			tooltipProps={{
				position: "bottom",
				label: "AI integrations",
				children: null,
			}}
			onClick={handleOpen}
		>
			<Icon
				path={iconSidekick}
				size="lg"
			/>
		</ActionButton>
	);
}
