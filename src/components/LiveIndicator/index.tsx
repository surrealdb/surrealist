import classes from "./style.module.scss";
import clsx from "clsx";
import { Icon } from "../Icon";
import { Box, BoxProps, MantineColor } from "@mantine/core";
import { iconCircleFilled } from "~/util/icons";

export interface LiveIndicatorProps extends BoxProps {
	color?: MantineColor;
}

export function LiveIndicator(props: LiveIndicatorProps) {
	const {
		className,
		color,
		...rest
	} = props;

	const actualColor = color || "white";

	return (
		<Box
			className={clsx(classes.root, className)}
			__vars={{ '--ring-color': actualColor }}
			{...rest}
		>
			<Icon
				path={iconCircleFilled}
				title="Live query active"
				color={actualColor}
				size="xl"
			/>
		</Box>
	);
}