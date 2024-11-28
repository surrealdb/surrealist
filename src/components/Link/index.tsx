import { Text, type TextProps } from "@mantine/core";
import clsx from "clsx";
import { type PropsWithChildren, forwardRef } from "react";
import { adapter } from "~/adapter";
import classes from "./style.module.scss";

export interface LinkProps extends TextProps {
	href: string;
	underline?: boolean;
}

export const Link = forwardRef<HTMLParagraphElement, PropsWithChildren<LinkProps>>(
	({ href, underline, children, span, className, ...other }, ref) => {
		return (
			<Text
				onClick={() => adapter.openUrl(href)}
				className={clsx(classes.root, underline !== false && classes.underline, className)}
				span={span ?? true}
				role="link"
				ref={ref}
				{...other}
			>
				{children}
			</Text>
		);
	},
);
