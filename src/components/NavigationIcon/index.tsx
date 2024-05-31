import { Box, Tooltip } from "@mantine/core";
import clsx from "clsx";
import { HTMLProps, ReactNode } from "react";
import { useHoverIcon } from "~/hooks/hover-icon";
import { Entry, EntryProps } from "../Entry";
import { Icon } from "../Icon";
import classes from "./style.module.scss";

export interface NavigationIconProps
	extends EntryProps,
		Omit<
			HTMLProps<HTMLButtonElement>,
			"name" | "color" | "size" | "style" | "type" | "ref"
		> {
	name: ReactNode;
	isActive?: boolean;
	icon: string | any;
	withTooltip?: boolean;
	onClick: () => void;
}

export function NavigationIcon({
	name,
	isActive,
	icon,
	withTooltip,
	onClick,
	...rest
}: NavigationIconProps) {
	const hasIcon = typeof icon === "string";

	const { isLoading, ref, onMouseEnter, onMouseLeave } = useHoverIcon({
		animation: hasIcon ? { w: 0, h: 0, layers: [] } : icon,
		className: classes.animation,
	});

	return (
		<Tooltip label={name} position="right" disabled={!withTooltip} offset={14}>
			<Box w="100%" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
				<Entry
					className={clsx(
						classes.viewButton,
						isActive && classes.viewButtonActive,
					)}
					isActive={isActive}
					style={{ opacity: isLoading ? 0 : 1 }}
					onClick={onClick}
					leftSection={
						hasIcon ? <Icon path={icon} size="lg" /> : <div ref={ref} />
					}
					{...rest}
				>
					{name}
				</Entry>
			</Box>
		</Tooltip>
	);
}
