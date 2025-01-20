import { Box } from "@mantine/core";

export interface NodeCircleProps {
	color?: string;
	size?: number;
}

export function NodeCircle({ color, size }: NodeCircleProps) {
	const colorValue = color || "var(--mantine-color-slate-5)";

	return (
		<Box
			bd={`1.5px solid ${colorValue}`}
			style={{ borderRadius: "50%" }}
			p={1.5}
			ml={5}
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
