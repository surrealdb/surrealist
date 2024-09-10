import { Box, type BoxProps } from "@mantine/core";

export interface SpacerProps extends BoxProps {
	grow?: boolean | number;
}

export function Spacer({ grow, ...other }: SpacerProps) {
	return (
		<Box
			style={{ flexGrow: grow ? +grow : 1 }}
			{...other}
		/>
	);
}
