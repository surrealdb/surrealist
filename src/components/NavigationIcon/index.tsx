import classes from "./style.module.scss";
import clsx from "clsx";
import { Icon } from "../Icon";
import { Entry } from "../Entry";

export interface NavigationIconProps {
	name: string;
	isActive?: boolean;
	isLight: boolean;
	icon: string;
	onClick: () => void;
}

export function NavigationIcon({ name, isActive, isLight, icon, onClick, ...rest }: NavigationIconProps) {
	return (
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
	);
}