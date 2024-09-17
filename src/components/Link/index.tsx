import { Text, type TextProps } from "@mantine/core";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { adapter } from "~/adapter";
import classes from "./style.module.scss";

export interface LinkProps extends TextProps {
	href: string;
}

export function Link({
	href,
	children,
	span,
	className,
	...other
}: PropsWithChildren<LinkProps>) {
	return (
		<Text
			onClick={() => adapter.openUrl(href)}
			className={clsx(classes.root, className)}
			span={span ?? true}
			role="link"
			{...other}
		>
			{children}
		</Text>
	)
}