import classes from "./style.module.scss";
import clsx from "clsx";
import { Icon } from "../Icon";
import { Entry, EntryProps } from "../Entry";
import { HTMLProps, ReactNode } from "react";
import { Box, Stack, Text, Tooltip } from "@mantine/core";
import { useHoverIcon } from "~/hooks/hover-icon";

export interface NavigationIconProps extends EntryProps, Omit<HTMLProps<HTMLButtonElement>, 'name' | 'color' | 'size' | 'style' | 'type' | 'ref'> {
	name: ReactNode;
	isActive?: boolean;
	icon: string | any;
	unavailable?: string;
	withTooltip?: boolean;
	onClick: () => void;
}

export function NavigationIcon({
	name,
	isActive,
	icon,
	withTooltip,
	unavailable,
	disabled,
	onClick,
	...rest
}: NavigationIconProps) {
	const hasIcon = typeof icon === 'string';

	const {
		ref,
		onMouseEnter,
		onMouseLeave
	} = useHoverIcon({
		animation: hasIcon ? {w: 0, h: 0, layers:[]} : icon,
		className: classes.animation
	});

	return (
		<Tooltip
			label={name}
			position="right"
			disabled={!withTooltip}
			offset={14}
		>
			<Box
				w="100%"
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<Entry
					className={clsx(classes.viewButton, isActive && classes.viewButtonActive)}
					isActive={isActive}
					onClick={onClick}
					disabled={!!unavailable || disabled}
					leftSection={
						hasIcon ? (
							<Icon path={icon} size="lg" />
						) : (
							<div ref={ref} />
						)
					}
					{...rest}
				>
					<Stack
						align="start"
						gap={0}
					>
						<Text>{name}</Text>
						{unavailable && (
							<Text color="red" size="xs">
								{unavailable}
							</Text>
						)}
					</Stack>
				</Entry>
			</Box>
		</Tooltip>
	);
}