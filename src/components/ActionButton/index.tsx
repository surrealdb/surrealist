import {
	ActionIcon,
	type ActionIconProps,
	type ElementProps,
	Tooltip,
	type TooltipProps,
} from "@mantine/core";
import type { PropsWithChildren } from "react";

export interface ActionButtonProps extends ActionIconProps, ElementProps<"button", "color"> {
	label: string;
	tooltipProps?: TooltipProps;
}

/**
 * Combination of a Tooltip and an ActionIcon to create accessible icon buttons
 */
export function ActionButton({
	label,
	tooltipProps,
	...other
}: PropsWithChildren<ActionButtonProps>) {
	return (
		<Tooltip
			label={label}
			{...tooltipProps}
		>
			<ActionIcon
				{...other}
				aria-label={label}
			>
				{other.children}
			</ActionIcon>
		</Tooltip>
	);
}
