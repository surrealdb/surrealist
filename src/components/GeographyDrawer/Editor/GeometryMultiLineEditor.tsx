import {
	Group,
	NumberInput,
	Button,
	Stack,
	ActionIcon,
	Text,
	Divider,
} from "@mantine/core";
import { useState } from "react";
import { GeometryMultiLine, GeometryLine, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";

interface Props {
	value: GeometryMultiLine;
	onChange: (value: GeometryMultiLine) => void;
}

export function GeometryMultiLineEditor({ value, onChange }: Props) {
	const [multiLine, setMultiLine] = useState<GeometryMultiLine>(value);

	// Update a single coordinate in a specific line
	const onChangeCoordinate = useStable(
		(lineIdx: number, coordIdx: number, lng: number, lat: number) => {
			const lineCoords = multiLine.coordinates[lineIdx];
			const newCoords = lineCoords.map((coord, i) =>
				i === coordIdx ? [lng, lat] : coord,
			);

			const newLines = multiLine.coordinates.map((lineCoords, i) => {
				if (i === lineIdx) {
					return newCoords;
				}
				return lineCoords;
			});

			// Convert coordinate arrays to GeometryLine objects
			const geometryLines = newLines.map((coords) => {
				const points = coords.map(
					(coord) => new GeometryPoint(coord as [number, number]),
				);
				return new GeometryLine(
					points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
				);
			});

			const updated = new GeometryMultiLine(
				geometryLines as [GeometryLine, ...GeometryLine[]],
			);
			setMultiLine(updated);
			onChange(updated); // Pass class instance, not GeoJSON
		},
	);

	// Add a new line
	const onAddLine = useStable(() => {
		const newLineCoords: [number, number][] = [
			[0, 0],
			[0.01, 0.01],
		];

		// Convert existing coordinates to GeometryLine objects
		const existingLines = multiLine.coordinates.map((coords) => {
			const points = coords.map((coord) => new GeometryPoint(coord));
			return new GeometryLine(
				points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);
		});

		const newPoints = newLineCoords.map((coord) => new GeometryPoint(coord));
		const newLine = new GeometryLine(
			newPoints as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
		);

		const newLines = [...existingLines, newLine];
		const updated = new GeometryMultiLine(
			newLines as [GeometryLine, ...GeometryLine[]],
		);
		setMultiLine(updated);
		onChange(updated);
	});

	// Remove a line
	const onRemoveLine = useStable((lineIdx: number) => {
		if (multiLine.coordinates.length <= 1) return;

		// Convert coordinates to GeometryLine objects, excluding the one to remove
		const geometryLines = multiLine.coordinates
			.filter((_, i) => i !== lineIdx)
			.map((coords) => {
				const points = coords.map((coord) => new GeometryPoint(coord));
				return new GeometryLine(
					points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
				);
			});

		const updated = new GeometryMultiLine(
			geometryLines as [GeometryLine, ...GeometryLine[]],
		);
		setMultiLine(updated);
		onChange(updated);
	});

	// Add a point to a specific line
	const onAddPoint = useStable((lineIdx: number) => {
		const lineCoords = multiLine.coordinates[lineIdx];
		const last = lineCoords[lineCoords.length - 1] || [0, 0];
		const newCoords = [...lineCoords, [...last]];

		// Convert all coordinates to GeometryLine objects
		const geometryLines = multiLine.coordinates.map((lineCoords, i) => {
			const coords = i === lineIdx ? newCoords : lineCoords;
			const points = coords.map(
				(coord) => new GeometryPoint(coord as [number, number]),
			);
			return new GeometryLine(
				points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);
		});

		const updated = new GeometryMultiLine(
			geometryLines as [GeometryLine, ...GeometryLine[]],
		);
		setMultiLine(updated);
		onChange(updated);
	});

	// Remove a point from a specific line
	const onRemovePoint = useStable((lineIdx: number, coordIdx: number) => {
		const lineCoords = multiLine.coordinates[lineIdx];
		if (lineCoords.length <= 2) return; // LineString requires at least 2 points

		const newCoords = lineCoords.filter((_, i) => i !== coordIdx);

		// Convert all coordinates to GeometryLine objects
		const geometryLines = multiLine.coordinates.map((lineCoords, i) => {
			const coords = i === lineIdx ? newCoords : lineCoords;
			const points = coords.map((coord) => new GeometryPoint(coord));
			return new GeometryLine(
				points as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);
		});

		const updated = new GeometryMultiLine(
			geometryLines as [GeometryLine, ...GeometryLine[]],
		);
		setMultiLine(updated);
		onChange(updated);
	});

	return (
		<Stack h="100%" flex={1} style={{ overflowY: "auto" }}>
			{multiLine.coordinates.map((lineCoords, lineIdx) => (
				<Stack key={lineIdx} p="sm">
					<Group align="center" mb={4}>
						<Text fw={600}>Line #{lineIdx + 1}</Text>
						{multiLine.coordinates.length > 1 && (
							<ActionIcon
								color="red"
								onClick={() => onRemoveLine(lineIdx)}
								aria-label="Remove line"
								size="sm"
							>
								<Icon size="sm" path={iconClose} />
							</ActionIcon>
						)}
					</Group>
					{lineCoords.map(([lng, lat], coordIdx) => (
						<Group key={coordIdx} align="end" gap="xs">
							<NumberInput
								label={coordIdx === 0 ? "Longitude" : undefined}
								value={lng}
								step={0.000001}
								min={-180}
								max={180}
								onChange={(val) =>
									onChangeCoordinate(lineIdx, coordIdx, Number(val), lat)
								}
								flex={1}
							/>
							<NumberInput
								label={coordIdx === 0 ? "Latitude" : undefined}
								value={lat}
								step={0.000001}
								min={-90}
								max={90}
								onChange={(val) =>
									onChangeCoordinate(lineIdx, coordIdx, lng, Number(val))
								}
								flex={1}
							/>
							{lineCoords.length > 2 && (
								<ActionIcon
									color="red"
									onClick={() => onRemovePoint(lineIdx, coordIdx)}
									aria-label="Remove point"
									size="lg"
									mt={-1}
								>
									<Icon path={iconClose} />
								</ActionIcon>
							)}
						</Group>
					))}
					<Button
						leftSection={<Icon path={iconPlus} />}
						onClick={() => onAddPoint(lineIdx)}
						variant="light"
						mt="sm"
					>
						Add point
					</Button>
					{lineIdx < multiLine.coordinates.length - 1 && <Divider my="sm" />}
				</Stack>
			))}
			<Button
				leftSection={<Icon path={iconPlus} />}
				onClick={onAddLine}
				variant="light"
				mt="sm"
			>
				Add line
			</Button>
			<Text size="xs" c="dimmed">
				MultiLineString contains multiple LineStrings. Each LineString requires
				at least 2 points.
			</Text>
		</Stack>
	);
}
