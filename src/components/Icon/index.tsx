import { HTMLAttributes, useMemo } from "react";
import { Box, BoxProps, MantineColor, MantineSize, useMantineTheme } from "@mantine/core";
import { getIconSize, themeColor } from "~/util/mantine";

export interface IconProps extends Omit<BoxProps, "left" | "right">, Omit<HTMLAttributes<SVGElement>, "style"> {
	size?: MantineSize | number;
	color?: MantineColor;
	left?: boolean;
	right?: boolean;
	noStroke?: boolean;
	path: string;
}

export const Icon = ({ size, color, path, style, left, right, noStroke, ...rest }: IconProps): JSX.Element | null => {
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
			<path d={path} style={{
				fill: 'currentColor',
				stroke: 'currentcolor',
				strokeWidth: noStroke ? 0 : 0.5
			}} />
		</Box>
	);
};
