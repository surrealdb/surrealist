import {
	Paper,
	type PaperProps,
	UnstyledButton,
	createPolymorphicComponent,
} from "@mantine/core";
import clsx from "clsx";
import { forwardRef } from "react";
import classes from "./style.module.scss";

export interface TileProps extends PaperProps {
	isActive?: boolean;
	disabled?: boolean;
	children: React.ReactNode;
}

export const Tile = createPolymorphicComponent<"button", TileProps>(
	forwardRef<HTMLDivElement, TileProps>(
		({ isActive, disabled, children, className, ...other }, ref) => (
			<Paper
				p="md"
				ref={ref}
				renderRoot={(props) => <UnstyledButton disabled={disabled} {...props} />}
				className={clsx(classes.root, disabled && classes.disabled, className)}
				mod={{ active: isActive }}
				{...other}
			>
				{children}
			</Paper>
		),
	),
);
