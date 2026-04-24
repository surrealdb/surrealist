import { Text, type TextProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

/**
 * @deprecated Use Title component instead
 */
export function PrimaryTitle({ children, ...rest }: PropsWithChildren<TextProps>) {
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
