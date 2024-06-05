import { Text, TextProps } from "@mantine/core";
import { PropsWithChildren } from "react";

export function Label(props: PropsWithChildren<TextProps>) {
	return (
		<Text
			style={{ color: 'var(--mantine-color-text)' }}
			size="sm"
			fw={500}
		>
			{props.children}
		</Text>
	);
}