import { Box, BoxProps } from "@mantine/core";
import clsx from "clsx";
import { iconCircle } from "~/util/icons";
import { Icon } from "../Icon";
import classes from "./style.module.scss";

export interface LiveIndicatorProps extends BoxProps {}

export function LiveIndicator(props: LiveIndicatorProps) {
	const { className, ...rest } = props;

	return (
		<Box className={clsx(classes.root, className)} {...rest}>
			<Icon
				path={iconCircle}
				title="Live query active"
				color="white"
				size="xl"
			/>
		</Box>
	);
}
