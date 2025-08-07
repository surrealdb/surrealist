import { Group, NumberInput } from "@mantine/core";
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
		<Group grow>
			<NumberInput
				label="Longitude"
				value={point.coordinates[0]}
				onChange={(value) =>
					onChangePoint([Number(value), point.coordinates[1]])
				}
			/>
			<NumberInput
				label="Latitude"
				value={point.coordinates[1]}
				onChange={(value) =>
					onChangePoint([point.coordinates[0], Number(value)])
				}
			/>
		</Group>
	);
}
