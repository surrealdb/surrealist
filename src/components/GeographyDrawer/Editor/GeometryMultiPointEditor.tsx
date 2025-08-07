import {
	Group,
	NumberInput,
	Button,
	Stack,
	ActionIcon,
	Text,
} from "@mantine/core";
import { useState } from "react";
import { GeometryMultiPoint, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";

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
		const newCoords = [...multiPoint.coordinates, [0, 0]];
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
		<Stack>
			{multiPoint.coordinates.map(([long, lati], i) => (
				<Group key={i} align="end" gap="xs">
					<NumberInput
						label={i === 0 ? "Longitude" : undefined}
						value={long}
						step={0.000001}
						min={-180}
						max={180}
						onChange={(val) => onChangePoint(i, Number(val), lati)}
						flex={1}
					/>
					<NumberInput
						label={i === 0 ? "Latitude" : undefined}
						value={lati}
						step={0.000001}
						min={-90}
						max={90}
						onChange={(val) => onChangePoint(i, long, Number(val))}
						flex={1}
					/>
					{multiPoint.coordinates.length > 1 && (
						<ActionIcon
							color="red"
							onClick={() => onRemovePoint(i)}
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
				onClick={onAddPoint}
				mt="sm"
			>
				Add point
			</Button>
			<Text size="xs" c="dimmed">
				MultiPoint requires at least 1 point.
			</Text>
		</Stack>
	);
}
