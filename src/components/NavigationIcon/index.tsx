import classes from "./style.module.scss";
import clsx from "clsx";
import { Icon } from "../Icon";
import { Entry, EntryProps } from "../Entry";

export interface NavigationIconProps extends EntryProps {
	name: string;
	isActive?: boolean;
	icon: string;
	onClick: () => void;
}

export function NavigationIcon({ name, isActive, icon, onClick, ...rest }: NavigationIconProps) {
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