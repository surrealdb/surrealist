import { useMemo } from "react";
import { BaseEdge, type EdgeProps, SmoothStepEdge } from "reactflow";
import type { EdgeData } from "../helpers";

export function ElkStepEdge({
	sourceX,
	sourceY,
	targetX,
	targetY,
	data,
	...rest
}: EdgeProps<EdgeData>) {
	const bendSection = data?.path;

	const edgePath = useMemo(() => {
		if (!bendSection) {
			return `M${sourceX},${sourceY} L${targetX},${targetY}`;
		}

		const bends: string =
			bendSection.bendPoints
				?.map((v, index, arr) => {
					const minBendRadius = 8;
					const maxBendRadius = 36;

					const lastSection = arr[index - 1] ?? bendSection.startPoint;
					const nextSection = arr[index + 1] ?? bendSection.endPoint;

					const lastLength = Math.max(
						Math.abs(lastSection.x - v.x),
						Math.abs(lastSection.y - v.y),
					);
					const nextLength = Math.max(
						Math.abs(nextSection.x - v.x),
						Math.abs(nextSection.y - v.y),
					);

					const _bend = Math.min(lastLength, nextLength) / 2;
					const bendRadius = Math.max(Math.min(_bend, maxBendRadius), minBendRadius);

					// NOTE: values are rounded because the values can differ by a very small amount
					const lastRounded = {
						x: Math.round(lastSection.x),
						y: Math.round(lastSection.y),
					};

					const currentRounded = {
						x: Math.round(v.x),
						y: Math.round(v.y),
					};

					const nextRounded = {
						x: Math.round(nextSection.x),
						y: Math.round(nextSection.y),
					};

					if (currentRounded.x === lastRounded.x && nextRounded.x > currentRounded.x) {
						// Bend to the right
						if (lastRounded.y > currentRounded.y) {
							// From the bottom
							return `L${v.x},${v.y + bendRadius} Q${v.x},${v.y}, ${v.x + bendRadius},${v.y}`;
						}

						// From the top
						return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x + bendRadius},${v.y}`;
					}

					if (currentRounded.x === lastRounded.x && nextRounded.x < currentRounded.x) {
						// Bend to the left
						if (lastRounded.y > currentRounded.y) {
							// From the bottom
							return `L${v.x},${v.y + bendRadius} Q${v.x},${v.y}, ${v.x - bendRadius},${v.y}`;
						}

						// From the top
						return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x - bendRadius},${v.y}`;
					}

					if (currentRounded.y === lastRounded.y && nextRounded.y > currentRounded.y) {
						// Bend to the bottom
						if (lastRounded.x > currentRounded.x) {
							// From the right
							return `L${v.x + bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
						}

						// From the left
						return `L${v.x - bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
					}

					if (currentRounded.y === lastRounded.y && nextRounded.y < currentRounded.y) {
						// Bend to the top
						if (lastRounded.x > currentRounded.x) {
							// From the right
							return `L${v.x + bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y - bendRadius}`;
						}

						// From the left
						return `L${v.x - bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y - bendRadius}`;
					}

					console.error(
						"Unknown bend direction",
						lastRounded,
						currentRounded,
						nextRounded,
					);

					return `L${v.x},${v.y}`;
				})
				.join(" ") || "";

		return `M${bendSection.startPoint.x},${bendSection.startPoint.y} ${bends} L${bendSection.endPoint.x},${bendSection.endPoint.y}`;
	}, [bendSection, sourceX, sourceY, targetX, targetY]);

	const labelPosition = useMemo(() => {
		if (!bendSection) {
			return {
				x: sourceX + (targetX - sourceX) / 2,
				y: sourceY + (targetY - sourceY) / 2,
			};
		}

		const position = {
			x: bendSection.startPoint.x + (bendSection.endPoint.x - bendSection.startPoint.x) / 2,
			y: bendSection.startPoint.y + (bendSection.endPoint.y - bendSection.startPoint.y) / 2,
		};

		if (bendSection.bendPoints && bendSection.bendPoints.length > 0) {
			const firstMiddleBendLocation = Math.floor(bendSection.bendPoints.length / 2) - 1;
			const firstMiddleBend = bendSection.bendPoints[firstMiddleBendLocation];
			const lastMiddleBendLocation = Math.ceil(bendSection.bendPoints.length / 2) - 1;
			const lastMiddleBend =
				lastMiddleBendLocation === firstMiddleBendLocation
					? bendSection.bendPoints[lastMiddleBendLocation + 1]
					: bendSection.bendPoints[lastMiddleBendLocation];

			position.x = firstMiddleBend.x + (lastMiddleBend.x - firstMiddleBend.x) / 2;
			position.y = firstMiddleBend.y + (lastMiddleBend.y - firstMiddleBend.y) / 2;
		}

		return position;
	}, [bendSection, sourceX, sourceY, targetX, targetY]);

	if (!bendSection || data?.isDragged) {
		return (
			<SmoothStepEdge
				{...rest}
				data={data}
				sourceX={sourceX}
				sourceY={sourceY}
				targetX={targetX}
				targetY={targetY}
			/>
		);
	}

	return (
		<BaseEdge
			{...rest}
			path={edgePath}
			labelX={labelPosition.x}
			labelY={labelPosition.y}
		/>
	);
}
