import { HTMLAttributes, useMemo } from "react";
import { Box, BoxProps, MantineColor, MantineTheme, getSize, useMantineTheme } from "@mantine/core";

const FONT_SIZES: Record<string, number> = {
	xs: 0.5,
	sm: 0.75,
	md: 1,
	lg: 1.5,
	xl: 2,
};

export interface IconProps extends Omit<BoxProps, "left" | "right">, HTMLAttributes<SVGElement> {
	size?: string | number;
	color?: MantineColor;
	left?: boolean;
	right?: boolean;
	path: string;
}

export const Icon = ({ size, color, path, style, left, right, ...rest }: IconProps): JSX.Element | null => {
	const theme = useMantineTheme();
	const iconColor = getIconColor(theme, color);
	const iconSize = `calc(${getIconSize(size)} * 1.5)`;

	const pathStyle = useMemo(() => ({ fill: iconColor }), [iconColor]);

	const svgStyle = useMemo(
		() => ({
			width: iconSize,
			height: iconSize,
			verticalAlign: "middle",
			marginRight: left ? "0.5em" : undefined,
			marginLeft: right ? "0.5em" : undefined,
			flexShrink: 0,
			...style,
		}),
		[iconSize, left, right, style]
	);

	return (
		<Box component="svg" viewBox="0 0 24 24" role="presentation" style={svgStyle} {...rest}>
			<path d={path} style={pathStyle} />
		</Box>
	);
};

function getIconColor(theme: MantineTheme, color: MantineColor | undefined): string {
	return color === undefined
		? "currentColor"
		: (theme.fn.variant({
			color,
			variant: "filled",
			primaryFallback: false,
		}).background as string);
}

function getIconSize(size: string | number | undefined): string {
	if (size === undefined) {
		return "1em";
	} else if (typeof size === "number") {
		return getSize({ size, sizes: FONT_SIZES, units: "em" });
	} else {
		return getSize({ size, sizes: FONT_SIZES, units: "em" }) + "em";
	}
}
