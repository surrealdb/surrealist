import { Text, TextProps } from "@mantine/core";
import { PropsWithChildren } from "react";

export function ModalTitle({ children, ...rest }: PropsWithChildren<TextProps>) {
	return (
		<Text
			fw={700}
			fz={20}
			c="bright"
			{...rest}
		>
			{children}
		</Text>
	);
}