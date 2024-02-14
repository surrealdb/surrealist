import { HTMLAttributes, useMemo } from "react";
import { Box, BoxProps, MantineColor, MantineSize, useMantineTheme } from "@mantine/core";
import { themeColor } from "~/util/mantine";

const FONT_SIZES: Record<string, number> = {
	xs: 0.5,
	sm: 0.75,
	md: 1,
	lg: 1.5,
	xl: 2,
};

export interface IconProps extends Omit<BoxProps, "left" | "right">, Omit<HTMLAttributes<SVGElement>, "style"> {
	size?: MantineSize | number;
	color?: MantineColor;
	left?: boolean;
	right?: boolean;
	path: string;
}

export const Icon = ({ size, color, path, style, left, right, ...rest }: IconProps): JSX.Element | null => {
	const theme = useMantineTheme();

	const svgStyle = useMemo(() => {
		const iconSize = getIconSize(size) * 1.5;

		return Object.assign({}, style || {}, {
			color: color ? themeColor(color) : undefined,
			width: iconSize + 'em',
			height: iconSize + 'em',
			verticalAlign: 'middle',
			marginRight: left ? '0.5em' : undefined,
			marginLeft: right ? '0.5em' : undefined,
			flexShrink: 0,
		});
	}, [color, left, right, size, style, theme]);

	return (
		<Box component="svg" viewBox="0 0 24 24" role="presentation" style={svgStyle} {...rest}>
			<path d={path} style={{ fill: 'currentColor' }} />
		</Box>
	);
};

function getIconSize(size: string | number | undefined): number {
	if (size === undefined) {
		return 1;
	} else if (typeof size === 'number') {
		return size;
	} else {
		return FONT_SIZES[size] || 1;
	}
}
