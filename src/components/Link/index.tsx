import { Text, type TextProps } from "@mantine/core";
import clsx from "clsx";
import { forwardRef, type PropsWithChildren } from "react";
import { adapter } from "~/adapter";
import classes from "./style.module.scss";

export interface LinkProps extends TextProps {
	href: string;
}

export const Link = forwardRef<HTMLParagraphElement, PropsWithChildren<LinkProps>>(({
	href,
	children,
	span,
	className,
	...other
}, ref) => {
	return (
		<Text
			onClick={() => adapter.openUrl(href)}
			className={clsx(classes.root, className)}
			span={span ?? true}
			role="link"
			ref={ref}
			{...other}
		>
			{children}
		</Text>
	)
});