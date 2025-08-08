import { Group, NumberInput, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { GeometryPoint } from "surrealdb";
import { useStable } from "~/hooks/stable";

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
		<Stack gap="xs">
			<Group grow>
				<NumberInput
					label="Longitude"
					value={point.coordinates[0]}
					size="sm"
					step={0.000001}
					min={-180}
					max={180}
					allowNegative
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
					onChange={(value) =>
						onChangePoint([point.coordinates[0], Number(value)])
					}
				/>
			</Group>
			<Text size="xs" c="slate">
				Enter coordinates in WGS84 (lng, lat)
			</Text>
		</Stack>
	);
}
