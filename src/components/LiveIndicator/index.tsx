import { Box, type BoxProps, type MantineColor } from "@mantine/core";
import { Icon, iconCircleFilled } from "@surrealdb/ui";
import clsx from "clsx";
import classes from "./style.module.scss";

export interface LiveIndicatorProps extends BoxProps {
	color?: MantineColor;
}

export function LiveIndicator(props: LiveIndicatorProps) {
	const { className, color, ...rest } = props;

	const actualColor = color || "white";

	return (
		<Box
			className={clsx(classes.root, className)}
			__vars={{ "--ring-color": actualColor }}
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
