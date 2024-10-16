import { useMemo } from "react";
import { BaseEdge, EdgeProps, SmoothStepEdge } from "reactflow";

interface EdgeData extends Object {
	data: any;
	elkData?: {
		bendSections: import("elkjs/lib/elk.bundled").ElkEdgeSection[];
		isDragged: boolean;
	}
}

export function ElkStepEdge({
	sourceX,
	sourceY,
	targetX,
	targetY,
	data,
	...rest
}: EdgeProps<EdgeData>) {
	const bendSection = useMemo(() => !!data?.elkData?.bendSections ? data.elkData.bendSections[0] : undefined, [data?.elkData?.bendSections]);

	const edgePath = useMemo(() => {
		if (!bendSection) {
			return `M${sourceX},${sourceY} L${targetX},${targetY}`;
		}

		const bends: string = bendSection.bendPoints?.map((v, index, arr) => {
			const minBendRadius = 8;
			const maxBendRadius = 36;

			const lastSection = arr[index - 1] ?? bendSection.startPoint;
			const nextSection = arr[index + 1] ?? bendSection.endPoint;

			const lastLength = Math.max(Math.abs(lastSection.x - v.x), Math.abs(lastSection.y - v.y));
			const nextLength = Math.max(Math.abs(nextSection.x - v.x), Math.abs(nextSection.y - v.y));

			const _bend = Math.min(lastLength, nextLength) / 2;
			const bendRadius = Math.max(Math.min(_bend, maxBendRadius), minBendRadius);

			if (
				v.x === lastSection.x &&
				nextSection.x > v.x
			) {
				if (v.y < lastSection.y) {
					// bends to the right from the bottom
					return `L${v.x},${v.y + bendRadius} Q${v.x},${v.y}, ${v.x + bendRadius},${v.y}`;
				}

				// bends to the right from the top
				return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x + bendRadius},${v.y}`;
			} else if (
				v.x === lastSection.x &&
				nextSection.x < v.x
			) {
				if (v.y < lastSection.y) {
					// bends to the left from the bottom
					return `L${v.x},${v.y + bendRadius} Q${v.x},${v.y}, ${v.x - bendRadius},${v.y}`;
				}

				// bends to the left from the top
				return `L${v.x},${v.y - bendRadius} Q${v.x},${v.y}, ${v.x - bendRadius},${v.y}`;
			} else if (
				v.y === lastSection.y &&
				nextSection.y > v.y
			) {
				if (v.x < lastSection.x) {
					// bends down from the right
					return `L${v.x + bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
				}

				// bends down from the left
				return `L${v.x - bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y + bendRadius}`;
			} else if (
				v.y === lastSection.y &&
				nextSection.y < v.y
			) {
				if (v.x < lastSection.x) {
					// bends up from the right
					return `L${v.x + bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y - bendRadius}`;
				}

				// bends up from the left
				return `L${v.x - bendRadius},${v.y} Q${v.x},${v.y}, ${v.x},${v.y - bendRadius}`;
			}

			return `L${v.x},${v.y}`;
		}).join(' ') || "";

		return `M${bendSection.startPoint.x},${bendSection.startPoint.y} ${bends} L${bendSection.endPoint.x},${bendSection.endPoint.y}`;
	}, [bendSection]);

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
			const lastMiddleBend = lastMiddleBendLocation === firstMiddleBendLocation ? bendSection.bendPoints[lastMiddleBendLocation + 1] : bendSection.bendPoints[lastMiddleBendLocation];

			position.x = firstMiddleBend.x + (lastMiddleBend.x - firstMiddleBend.x) / 2;
			position.y = firstMiddleBend.y + (lastMiddleBend.y - firstMiddleBend.y) / 2;
		}

		return position;
	}, [bendSection]);

	if (!bendSection || data?.elkData?.isDragged) {
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
