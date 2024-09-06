import { Text, type TextProps } from "@mantine/core";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

export function Label({
	className,
	children,
	...other
}: PropsWithChildren<TextProps>) {
	return (
		<Text
			className={clsx("mantine-InputWrapper-label", className)}
			{...other}
		>
			{children}
		</Text>
	);
}
