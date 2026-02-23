import { InputLabel, InputLabelProps } from "@mantine/core";
import type { PropsWithChildren } from "react";

export function Label({ className, children, ...other }: PropsWithChildren<InputLabelProps>) {
	return (
		<InputLabel
			c="bright"
			fw={600}
			mb={4}
			data-variant="filled"
			{...other}
		>
			{children}
		</InputLabel>
	);
}
