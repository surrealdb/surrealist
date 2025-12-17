import { Box, type BoxProps, type MantineColor, type MantineSize } from "@mantine/core";
import clsx from "clsx";
import { type HTMLAttributes, useMemo } from "react";
import { getIconSize, themeColor } from "~/util/mantine";
import classes from "./style.module.scss";

export interface IconProps
	extends Omit<BoxProps, "left" | "right">,
		Omit<HTMLAttributes<SVGElement>, "style"> {
	size?: MantineSize | number;
	color?: MantineColor;
	left?: boolean;
	right?: boolean;
	noStroke?: boolean;
	spin?: boolean;
	path: string;
	flip?: "horizontal" | "vertical";
}

export const Icon = ({
	size,
	color,
	spin,
	path,
	style,
	left,
	right,
	noStroke,
	flip,
	...rest
}: IconProps): JSX.Element | null => {
	const svgStyle = useMemo(() => {
		const iconSize = getIconSize(size) * 1.5;
		const iconStyle = style || {};

		const styleMarginRight = "marginRight" in iconStyle ? iconStyle.marginRight : undefined;
		const styleMarginLeft = "marginLeft" in iconStyle ? iconStyle.marginLeft : undefined;
		const styleTransform = "transform" in iconStyle ? iconStyle.transform : undefined;

		return Object.assign({}, iconStyle, {
			color: color ? themeColor(color) : undefined,
			width: `${iconSize}em`,
			height: `${iconSize}em`,
			verticalAlign: "middle",
			marginRight: left ? "0.5em" : styleMarginRight,
			marginLeft: right ? "0.5em" : styleMarginLeft,
			flexShrink: 0,
			transform:
				flip === "horizontal"
					? "scaleX(-1)"
					: flip === "vertical"
						? "scaleY(-1)"
						: styleTransform,
		});
	}, [color, left, right, size, style, flip]);

	return (
		<Box
			component="svg"
			viewBox="0 0 24 24"
			role="presentation"
			className={clsx(spin && classes.spinning)}
			style={svgStyle}
			{...rest}
		>
			<path
				d={path}
				style={{
					fill: "currentColor",
					stroke: "currentcolor",
					strokeWidth: noStroke ? 0 : 0.5,
				}}
			/>
		</Box>
	);
};
