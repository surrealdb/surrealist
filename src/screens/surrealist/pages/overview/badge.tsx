import { Badge, Indicator, MantineColor, Tooltip } from "@mantine/core";
import { InstanceState } from "~/types";

const BADGE_INFO = {
	ready: ["green", "Instance is active and utilizing resources"],
	updating: ["yellow", "Instance is currently updating"],
	creating: ["yellow", "Provisioning instance..."],
	deleting: ["red", "Deleting instance..."],
	inactive: ["slate", "Instance is inactive"],
} satisfies Record<InstanceState, [MantineColor, string]>;

export interface StateBadgeProps {
	state: InstanceState;
}

export function StateBadge({ state }: StateBadgeProps) {
	const [color, text] = BADGE_INFO[state];

	return (
		<Tooltip label={text}>
			<Indicator
				processing={state === "ready"}
				color={color}
				ml="xs"
			/>
		</Tooltip>
	);
}
