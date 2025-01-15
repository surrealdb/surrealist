import { NodeHoverDrawingFunction, NodeLabelDrawingFunction } from "sigma/rendering";
import { getIsLight } from "~/hooks/theme";
import { RelationGraphEdge, RelationGraphNode } from ".";

export const drawHover: NodeHoverDrawingFunction<RelationGraphNode, RelationGraphEdge> = (
	context,
	data,
	settings,
) => {
	const size = data.labelSize || settings.labelSize;
	const font = settings.labelFont;
	const weight = settings.labelWeight;
	const isLight = getIsLight();

	const display = { ...data, label: data.label || data.hoverLabel };

	context.font = `${weight} ${size}px ${font}`;
	context.fillStyle = isLight ? "#FFF" : "#000";

	const PADDING = 4;

	if (typeof display.label === "string") {
		const textWidth = context.measureText(display.label).width;
		const boxWidth = Math.round(textWidth + 5);
		const boxHeight = Math.round(size + 2 * PADDING);
		const radius = Math.max(display.size, size / 2) + PADDING;

		const angleRadian = Math.asin(boxHeight / 2 / radius);
		const xDeltaCoord = Math.sqrt(Math.abs(radius ** 2 - (boxHeight / 2) ** 2));

		context.beginPath();
		context.moveTo(display.x + xDeltaCoord, display.y + boxHeight / 2);
		context.lineTo(display.x + radius + boxWidth, display.y + boxHeight / 2);
		context.lineTo(display.x + radius + boxWidth, display.y - boxHeight / 2);
		context.lineTo(display.x + xDeltaCoord, display.y - boxHeight / 2);
		context.arc(display.x, display.y, radius, angleRadian, -angleRadian);
		context.closePath();
		context.fill();
	} else {
		context.beginPath();
		context.arc(display.x, display.y, display.size + PADDING, 0, Math.PI * 2);
		context.closePath();
		context.fill();
	}

	// And finally we draw the label
	drawLabel(context, display, settings);
};

export const drawLabel: NodeLabelDrawingFunction<RelationGraphNode, RelationGraphEdge> = (
	context,
	data,
	settings,
) => {
	if (!data.label) return;

	const size = data.labelSize || settings.labelSize;
	const font = settings.labelFont;
	const weight = settings.labelWeight;
	const color = data.labelColor || settings.labelColor.color;

	context.fillStyle = color;
	context.font = `${weight} ${size}px ${font}`;

	context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
};
