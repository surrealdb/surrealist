import {
	Button,
	type ButtonProps,
	createPolymorphicComponent,
} from "@mantine/core";
import clsx from "clsx";
import { forwardRef } from "react";
import { useIsLight } from "~/hooks/theme";
import classes from "./style.module.scss";

export interface EntryProps extends ButtonProps {
	isActive?: boolean;
}

export const Entry = createPolymorphicComponent<"button", EntryProps>(
	forwardRef<HTMLButtonElement, EntryProps>((props, ref) => {
		const isLight = useIsLight();

		const { isActive, children, className, ...rest } = props;

		return (
			<Button
				ref={ref}
				fullWidth
				miw={0}
				h={38}
				px={8}
				color={isLight ? "slate.0" : "slate.7"}
				{...rest}
				variant={isActive ? "gradient" : rest.variant || "subtle"}
				className={clsx(
					classes.root,
					isActive && classes.active,
					className,
				)}
			>
				{children}
			</Button>
		);
	}),
);
