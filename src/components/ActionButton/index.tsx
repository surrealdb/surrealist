import {
	ActionIcon,
	type ActionIconProps,
	type ElementProps,
	Stack,
	Text,
	Tooltip,
	type TooltipProps,
} from "@mantine/core";
import type { PropsWithChildren, ReactNode } from "react";

export interface ActionButtonProps extends ActionIconProps, ElementProps<"button", "color"> {
	label: string;
	description?: ReactNode;
	tooltipProps?: TooltipProps;
}

/**
 * Combination of a Tooltip and an ActionIcon to create accessible icon buttons
 */
export function ActionButton({
	label,
	description,
	tooltipProps,
	...other
}: PropsWithChildren<ActionButtonProps>) {
	const tooltipLabel = description ? (
		<Stack gap={4}>
			<Text>{label}</Text>
			<Text
				c="dimmed"
				size="sm"
			>
				{description}
			</Text>
		</Stack>
	) : label;

	return (
		<Tooltip
			maw={description ? 175 : undefined}
			multiline={!!description}
			label={tooltipLabel}
			openDelay={300}
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
