import classes from "./style.module.scss";

import clsx from "clsx";
import { ElementProps, Paper, PaperProps } from "@mantine/core";
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
