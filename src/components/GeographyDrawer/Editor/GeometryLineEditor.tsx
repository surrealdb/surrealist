import {
	Group,
	NumberInput,
	Button,
	Stack,
	ActionIcon,
	Text,
	Badge,
} from "@mantine/core";
import { useState } from "react";
import { GeometryLine, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconCancel, iconClose, iconPlus } from "~/util/icons";

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
		<Stack>
			{line.coordinates.map(([long, lati], i) => (
				<Group key={i} align="end" gap="xs">
					<Badge size="sm" variant="light" color="slate" radius="sm">
						#{i + 1}
					</Badge>
					<NumberInput
						label={i === 0 ? "Longitude" : undefined}
						value={long}
						step={0.000001}
						min={-180}
						max={180}
						size="sm"
						allowNegative
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
						onChange={(val) => onChangeLine(i, long, Number(val))}
						flex={1}
					/>
					{line.coordinates.length > 2 && (
						<ActionIcon
							variant="subtle"
							color="slate"
							onClick={() => onRemovePoint(i)}
							aria-label="Remove point"
							size="md"
							mt={-1}
						>
							<Icon path={iconClose} />
						</ActionIcon>
					)}
				</Group>
			))}
			<Group justify="space-between" mt="xs">
				<Text size="xs" c="slate">
					LineString requires at least 2 points.
				</Text>
				<Button
					leftSection={<Icon path={iconPlus} />}
					onClick={onAddPoint}
					variant="default"
					size="xs"
				>
					Add point
				</Button>
			</Group>
		</Stack>
	);
}
