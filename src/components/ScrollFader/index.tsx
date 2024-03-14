import { Box, BoxProps } from "@mantine/core";

export function ScrollFader({ style, ...rest }: BoxProps) {
	return (
		<Box
			style={{
				height: 14,
				background: 'linear-gradient(180deg, var(--mantine-color-body) 0%, transparent 100%',
				zIndex: 1,
				...style
			}}
			{...rest}
		/>
	);
}