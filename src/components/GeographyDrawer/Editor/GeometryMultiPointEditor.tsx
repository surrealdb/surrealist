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
import { GeometryMultiPoint, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus, iconGeometryMultiPoint } from "~/util/icons";

interface Props {
	value: GeometryMultiPoint;
	onChange: (value: GeometryMultiPoint) => void;
}

export function GeometryMultiPointEditor({ value, onChange }: Props) {
	const [multiPoint, setMultiPoint] = useState<GeometryMultiPoint>(value);

	// Update a single point's coordinates
	const onChangePoint = useStable(
		(index: number, long: number, lati: number) => {
			const newCoords = multiPoint.coordinates.map((coord, i) =>
				i === index ? [long, lati] : coord,
			);
			const newPoints = newCoords.map(
				([lng, lat]) => new GeometryPoint([lng, lat]),
			);
			const updated = new GeometryMultiPoint(
				newPoints as [GeometryPoint, ...GeometryPoint[]],
			);
			setMultiPoint(updated);
			onChange(updated); // Pass class instance, not GeoJSON
		},
	);

	// Add a new point
	const onAddPoint = useStable(() => {
		const lastPoint = multiPoint.coordinates[
			multiPoint.coordinates.length - 1
		] || [0, 0];
		const newCoords = [...multiPoint.coordinates, [...lastPoint]];
		const newPoints = newCoords.map(
			([lng, lat]) => new GeometryPoint([lng, lat]),
		);
		const updated = new GeometryMultiPoint(
			newPoints as [GeometryPoint, ...GeometryPoint[]],
		);
		setMultiPoint(updated);
		onChange(updated);
	});

	// Remove a point
	const onRemovePoint = useStable((index: number) => {
		if (multiPoint.coordinates.length <= 1) return;

		const newCoords = multiPoint.coordinates.filter((_, i) => i !== index);
		const newPoints = newCoords.map(
			([lng, lat]) => new GeometryPoint([lng, lat]),
		);

		const updated = new GeometryMultiPoint(
			newPoints as [GeometryPoint, ...GeometryPoint[]],
		);
		setMultiPoint(updated);
		onChange(updated);
	});

	return (
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group justify="space-between" mb="md">
					<Group gap="xs">
						<Icon path={iconGeometryMultiPoint} size="sm" />
						<Text size="sm" fw={500} c="bright">
							MultiPoint collection
						</Text>
					</Group>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{multiPoint.coordinates.length} points
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
					{multiPoint.coordinates.map(([long, lati], i) => (
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
								onChange={(val) => onChangePoint(i, Number(val), lati)}
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
								onChange={(val) => onChangePoint(i, long, Number(val))}
								flex={1}
							/>
							{multiPoint.coordinates.length > 1 && (
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
					MultiPoint contains multiple individual points
				</Text>
			</Card>
		</Stack>
	);
}
