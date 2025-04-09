import {
	Box,
	BoxProps,
	Center,
	Indicator,
	Loader,
	MantineColor,
	MantineSize,
	Tooltip,
} from "@mantine/core";
import { InstanceState } from "~/types";

const BADGE_INFO = {
	ready: ["green", "Instance is active and utilizing resources"],
	deleting: ["red", "Instance is scheduled for removal"],
	paused: ["slate.5", "Instance is paused and not utilizing resources"],
	updating: ["loader", "Updating instance..."],
	creating: ["loader", "Provisioning instance..."],
	pausing: ["loader", "Pausing instance..."],
	resuming: ["loader", "Resuming instance..."],
} satisfies Record<InstanceState, [MantineColor | "loader", string]>;

export interface StateBadgeProps extends BoxProps {
	state: InstanceState;
	size: number;
}

export function StateBadge({ state, size, ...other }: StateBadgeProps) {
	const [display, text] = BADGE_INFO[state];

	return (
		<Center
			{...other}
			w={size}
			h={size}
		>
			<Tooltip label={text}>
				{display !== "loader" ? (
					<Indicator
						processing={state === "ready"}
						color={display}
						size={size}
					/>
				) : (
					<Loader
						size={size}
						type="dots"
						style={{ transform: "scale(1.5)" }}
					/>
				)}
			</Tooltip>
		</Center>
	);
}
