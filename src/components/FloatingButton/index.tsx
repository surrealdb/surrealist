import classes from "./style.module.scss";

import { ActionIcon, type ActionIconProps, Affix } from "@mantine/core";
import { Icon } from "../Icon";
import clsx from "clsx";

export interface FloatingButtonProps extends ActionIconProps {
	icon: string;
	onClick?: () => void;
}

export function FloatingButton({ icon, className, onClick, ...other }: FloatingButtonProps) {
	return (
		<Affix
			position={{ bottom: 32, right: 32 }}
			zIndex={150}
		>
			<ActionIcon
				variant="gradient"
				radius="50%"
				size={64}
				className={clsx(classes.root, className)}
				onClick={onClick}
				{...other}
			>
				<Icon
					path={icon}
					size="xl"
				/>
			</ActionIcon>
		</Affix>
	);
}
