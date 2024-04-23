import classes from "./style.module.scss";
import { ActionIcon, ActionIconProps, MantineSize, createPolymorphicComponent } from "@mantine/core";
import { forwardRef, useMemo } from "react";
import { useHoverIcon } from "~/hooks/hover-icon";
import { getIconSize } from "~/util/mantine";

export interface HoverIconProps extends ActionIconProps {
	animation: any;
	iconSize?: MantineSize | number;
	withHardReset?: boolean;
}

export const HoverIcon = createPolymorphicComponent<'button', HoverIconProps>(forwardRef<HTMLButtonElement, HoverIconProps>(({
	animation,
	iconSize,
	withHardReset,
	size,
	...rest
}, ref) => {

	const vars = useMemo(() => {
		return {
			'--icon-size': (getIconSize(iconSize || size) * 1.5) + 'em'
		};
	}, [iconSize]);

	const {
		ref: iconRef,
		onMouseEnter,
		onMouseLeave
	} = useHoverIcon({
		animation,
		className: classes.icon,
		hardReset: withHardReset
	});

	return (
		<ActionIcon
			{...rest}
			ref={ref}
			size={size}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			__vars={vars}
		>
			<div ref={iconRef} />
		</ActionIcon>
	);
}));