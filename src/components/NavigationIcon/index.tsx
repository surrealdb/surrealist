import classes from "./style.module.scss";
import clsx from "clsx";
import { ActionIcon, ActionIconProps, Tooltip } from "@mantine/core";
import { Icon } from "../Icon";

export interface NavigationIconProps extends ActionIconProps {
	name: string;
	isActive?: boolean;
	isLight: boolean;
	icon: string;
	onClick: () => void;
}

export function NavigationIcon({ name, isActive, isLight, icon, onClick, ...rest }: NavigationIconProps) {
	return (
		<Tooltip
			position="right"
			label={name}
			ml="xs"
			transitionProps={{
				transition: "scale-x"
			}}
		>
			<ActionIcon
				color={isActive ? "surreal" : isLight ? "dark.8" : "dark.1"}
				variant={isActive ? "gradient" : "subtle"}
				className={clsx(classes.viewButton, isActive && classes.viewButtonActive)}
				onClick={onClick}
				radius="md"
				{...rest}
			>
				<Icon path={icon} />
			</ActionIcon>
		</Tooltip>
	);
}