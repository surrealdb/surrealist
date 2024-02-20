import classes from "./style.module.scss";
import clsx from "clsx";
import { Box, BoxProps } from "@mantine/core";
import { Icon } from "../Icon";
import { mdiCircle } from "@mdi/js";

export interface LiveIndicatorProps extends BoxProps {
}

export function LiveIndicator(props: LiveIndicatorProps) {

	const {
		className,
		...rest
	} = props;


	return (
		<Box
			className={clsx(classes.root, className)}
			{...rest}
		>
			<Icon
				path={mdiCircle}
				title="Live query active"
				color="red"
				size="sm"
			/>	
		</Box>
	);
}