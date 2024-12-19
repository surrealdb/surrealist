import classes from "./style.module.scss";

import { ElementProps, Paper, PaperProps } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren } from "react";

export interface SlabProps extends PaperProps, ElementProps<"div"> {}

export function Slab({ children, className, ...props }: PropsWithChildren<SlabProps>) {
	return (
		<Paper
			{...props}
			className={clsx(classes.root, className)}
		>
			{children}
		</Paper>
	);
}
