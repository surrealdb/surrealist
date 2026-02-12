import { Box, BoxProps } from "@mantine/core";

export interface NodeCircleProps extends BoxProps {
	color?: string;
	size?: number;
}

export function NodeCircle({ color, size, ...other }: NodeCircleProps) {
	const colorValue = color || "var(--mantine-color-obsidian-5)";

	return (
		<Box
			bd={`1.5px solid ${colorValue}`}
			style={{ borderRadius: "50%" }}
			p={1.5}
			{...other}
		>
			<Box
				bg={colorValue}
				style={{ borderRadius: "50%" }}
				w={size || 18}
				h={size || 18}
			/>
		</Box>
	);
}
