import { Box, BoxProps, MantineColor, MantineTheme, useMantineTheme } from "@mantine/core";
import { HTMLAttributes } from "react";
import { useMemo } from "react";

const FONT_SIZES: Record<string, number> = {
	xs: 0.5,
	sm: 0.75,
	md: 1,
	lg: 1.5,
	xl: 2
};

export interface IconProps extends Omit<BoxProps, 'left'|'right'>, HTMLAttributes<SVGElement> {
	size?: string | number;
	color?: MantineColor;
	left?: boolean;
	right?: boolean;
	path: string;
}

export const Icon = ({ size, color, path, style, left, right, ...rest }: IconProps): JSX.Element | null => {
	const theme = useMantineTheme();
	const iconColor = getIconColor(theme, color);
	const iconSize = getIconSize(theme, size) * 1.5;

	const pathStyle = useMemo(() => ({
		fill: iconColor
	}), [iconColor]);

	const svgStyle = useMemo(() => ({
		width: iconSize + 'em',
		height: iconSize + 'em',
		verticalAlign: 'middle',
		marginRight: left ? '0.5em' : undefined,
		marginLeft: right ? '0.5em' : undefined,
		...style
	}), [iconSize, left, right, style]);

	return (
		<Box
			component="svg"
			viewBox="0 0 24 24"
			role="presentation"
			style={svgStyle}
			{...rest}
		>
			<path
				d={path}
				style={pathStyle}
			/>
		</Box>
	);
};

function getIconColor(theme: MantineTheme, color: MantineColor|undefined): string {
	return color === undefined ? 'currentColor' : theme.fn.variant({
		color,
		variant: 'filled',
		primaryFallback: false
	}).background as string;
}

function getIconSize(theme: MantineTheme, size: string|number|undefined): number {
	return size === undefined ? 1 : theme.fn.size({ size, sizes: FONT_SIZES });
}
