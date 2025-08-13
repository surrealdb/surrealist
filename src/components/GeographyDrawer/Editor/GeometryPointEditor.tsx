import { Group, NumberInput, Stack, Text, Card } from "@mantine/core";
import { useState } from "react";
import { GeometryPoint } from "surrealdb";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { iconGeometryPoint } from "~/util/icons";

interface Props {
	value: GeometryPoint;
	onChange: (value: GeometryPoint) => void;
}

export function GeometryPointEditor({ value, onChange }: Props) {
	const [point, setPoint] = useState<GeometryPoint>(value);

	const onChangePoint = useStable((data: [number, number]) => {
		const point = new GeometryPoint(data);
		setPoint(point);
		onChange(point); // Pass class instance, not GeoJSON
	});

	return (
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group mb="sm" gap="xs">
					<Icon path={iconGeometryPoint} size="sm" />
					<Text size="sm" fw={500} c="bright">
						Point coordinates
					</Text>
				</Group>
				<Group grow>
					<NumberInput
						label="Longitude"
						value={point.coordinates[0]}
						size="sm"
						step={0.000001}
						min={-180}
						max={180}
						allowNegative
						decimalScale={6}
						fixedDecimalScale={false}
						placeholder="0.000000"
						onChange={(value) =>
							onChangePoint([Number(value), point.coordinates[1]])
						}
					/>
					<NumberInput
						label="Latitude"
						value={point.coordinates[1]}
						size="sm"
						step={0.000001}
						min={-90}
						max={90}
						allowNegative
						decimalScale={6}
						fixedDecimalScale={false}
						placeholder="0.000000"
						onChange={(value) =>
							onChangePoint([point.coordinates[0], Number(value)])
						}
					/>
				</Group>
				<Text size="xs" c="dimmed" mt="xs">
					Coordinates in WGS84 format (longitude, latitude)
				</Text>
			</Card>
		</Stack>
	);
}
