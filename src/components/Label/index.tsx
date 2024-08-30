import clsx from "clsx";
import { Text, TextProps } from "@mantine/core";
import { PropsWithChildren } from "react";

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