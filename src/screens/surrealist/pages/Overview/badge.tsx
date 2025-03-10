import { Indicator, Loader, MantineColor, Tooltip } from "@mantine/core";
import { InstanceState } from "~/types";

const BADGE_INFO = {
	ready: ["green", "Instance is active and utilizing resources"],
	deleting: ["red", "Instance is being deleted"],
	paused: ["slate.5", "Instance is paused and not utilizing resources"],
	updating: ["loader", "Updating instance..."],
	creating: ["loader", "Provisioning instance..."],
	pausing: ["loader", "Pausing instance..."],
	resuming: ["loader", "Resuming instance..."],
} satisfies Record<InstanceState, [MantineColor | "loader", string]>;

export interface StateBadgeProps {
	state: InstanceState;
}

export function StateBadge({ state }: StateBadgeProps) {
	const [display, text] = BADGE_INFO[state];

	return (
		<Tooltip label={text}>
			{display === "loader" ? (
				<Loader size="xs" />
			) : (
				<Indicator
					processing={state === "ready"}
					color={display}
					ml="xs"
				/>
			)}
		</Tooltip>
	);
}
