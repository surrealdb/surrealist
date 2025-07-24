import {
	ActionIcon,
	type ActionIconProps,
	createPolymorphicComponent,
	type ElementProps,
	MantineComponent,
	Stack,
	Text,
	Tooltip,
	type TooltipProps,
} from "@mantine/core";
import { forwardRef, type ReactNode } from "react";

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
