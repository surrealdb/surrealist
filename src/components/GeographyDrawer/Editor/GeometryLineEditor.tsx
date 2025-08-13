import {
	Group,
	NumberInput,
	Stack,
	ActionIcon,
	Text,
	Card,
	Tooltip,
} from "@mantine/core";
import { useState } from "react";
import { GeometryLine, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus, iconGeometryLine } from "~/util/icons";

interface Props {
	value: GeometryLine;
	onChange: (value: GeometryLine) => void;
}

export function GeometryLineEditor({ value, onChange }: Props) {
	const [line, setLine] = useState<GeometryLine>(value);

	// Update a single coordinate
	const onChangeLine = useStable(
		(index: number, long: number, lati: number) => {
			const newCoords = line.coordinates.map((coord, i) =>
				i === index ? [long, lati] : coord,
			);

			const newPoints = newCoords.map(
				([lng, lat]) => new GeometryPoint([lng, lat]),
			);

			const updated = new GeometryLine(
				newPoints as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
			);

			setLine(updated);
			onChange(updated); // Pass class instance, not GeoJSON
		},
	);

	// Add a new point (duplicate last or [0,0])
	const onAddPoint = useStable(() => {
		const last = line.coordinates[line.coordinates.length - 1] || [0, 0];
		const newCoords = [...line.coordinates, [...last]];

		const newPoints = newCoords.map(
			([lng, lat]) => new GeometryPoint([lng, lat]),
		);

		const updated = new GeometryLine(
			newPoints as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
		);

		setLine(updated);
		onChange(updated);
	});

	// Remove a point
	const onRemovePoint = useStable((index: number) => {
		if (line.coordinates.length <= 2) return;

		const newCoords = line.coordinates.filter((_, i) => i !== index);
		const newPoints = newCoords.map(
			([lng, lat]) => new GeometryPoint([lng, lat]),
		);

		const updated = new GeometryLine(
			newPoints as [GeometryPoint, GeometryPoint, ...GeometryPoint[]],
		);

		setLine(updated);
		onChange(updated);
	});

	return (
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group justify="space-between" mb="md">
					<Group gap="xs">
						<Icon path={iconGeometryLine} size="sm" />
						<Text size="sm" fw={500} c="bright">
							LineString points
						</Text>
					</Group>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{line.coordinates.length} points
						</Text>
						<Tooltip label="Add point">
							<ActionIcon
								variant="subtle"
								size="sm"
								onClick={onAddPoint}
								aria-label="Add point"
							>
								<Icon path={iconPlus} size="xs" />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>

				<Stack gap="sm">
					{line.coordinates.map(([long, lati], i) => (
						<Group key={i} align="end" gap="xs" wrap="nowrap">
							<NumberInput
								label={i === 0 ? "Longitude" : undefined}
								value={long}
								step={0.000001}
								min={-180}
								max={180}
								size="sm"
								allowNegative
								decimalScale={6}
								fixedDecimalScale={false}
								placeholder="0.000000"
								onChange={(val) => onChangeLine(i, Number(val), lati)}
								flex={1}
							/>
							<NumberInput
								label={i === 0 ? "Latitude" : undefined}
								value={lati}
								step={0.000001}
								min={-90}
								max={90}
								size="sm"
								allowNegative
								decimalScale={6}
								fixedDecimalScale={false}
								placeholder="0.000000"
								onChange={(val) => onChangeLine(i, long, Number(val))}
								flex={1}
							/>
							{line.coordinates.length > 2 && (
								<Tooltip label="Remove point">
									<ActionIcon
										variant="subtle"
										color="red"
										onClick={() => onRemovePoint(i)}
										aria-label="Remove point"
										size="sm"
										mt={i === 0 ? "xl" : undefined}
									>
										<Icon path={iconClose} size="xs" />
									</ActionIcon>
								</Tooltip>
							)}
						</Group>
					))}
				</Stack>

				<Text size="xs" c="dimmed" mt="md">
					LineString requires at least 2 points to form a line
				</Text>
			</Card>
		</Stack>
	);
}
