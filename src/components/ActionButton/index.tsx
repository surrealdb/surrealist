import {
	ActionIcon,
	type ActionIconProps,
	type ElementProps,
	MantineComponent,
	Stack,
	Text,
	Tooltip,
	type TooltipProps,
	createPolymorphicComponent,
} from "@mantine/core";
import { type ReactNode, forwardRef } from "react";

export interface ActionButtonProps
	extends ActionIconProps,
		MantineComponent<any>,
		ElementProps<"button", "color"> {
	label: string;
	description?: ReactNode;
	tooltipProps?: TooltipProps;
}

export const ActionButton = createPolymorphicComponent<"button", ActionButtonProps>(
	forwardRef<HTMLButtonElement, ActionButtonProps>(
		({ label, description, tooltipProps, ...other }, ref) => {
			const tooltipLabel = description ? (
				<Stack gap={2}>
					<Text>{label}</Text>
					<Text
						opacity={0.75}
						size="sm"
					>
						{description}
					</Text>
				</Stack>
			) : (
				label
			);

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
						ref={ref}
						aria-label={label}
					>
						{other.children}
					</ActionIcon>
				</Tooltip>
			);
		},
	),
);
