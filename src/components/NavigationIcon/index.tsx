import classes from "./style.module.scss";
import clsx from "clsx";
import { Icon } from "../Icon";
import { Entry, EntryProps } from "../Entry";
import { HTMLProps, ReactNode } from "react";
import { Tooltip } from "@mantine/core";

export interface NavigationIconProps extends EntryProps, Omit<HTMLProps<HTMLButtonElement>, 'name' | 'color' | 'size' | 'style' | 'type' | 'ref'> {
	name: ReactNode;
	isActive?: boolean;
	icon: string;
	withTooltip?: boolean;
	onClick: () => void;
}

export function NavigationIcon({ name, isActive, icon, withTooltip, onClick, ...rest }: NavigationIconProps) {
	return (
		<Tooltip
			label={name}
			position="right"
			disabled={!withTooltip}
			offset={14}
		>
			<Entry
				className={clsx(classes.viewButton, isActive && classes.viewButtonActive)}
				isActive={isActive}
				onClick={onClick}
				leftSection={
					<Icon path={icon} size="lg" />
				}
				{...rest}
			>
				{name}
			</Entry>
		</Tooltip>
	);
}