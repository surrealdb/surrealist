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
import { GeometryPolygon, GeometryLine, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";

interface Props {
	value: GeometryPolygon;
	onChange: (value: GeometryPolygon) => void;
}

export function GeometryPolygonEditor({ value, onChange }: Props) {
	const [polygon, setPolygon] = useState<GeometryPolygon>(value);

	// Helper to update a ring
	const updateRing = useStable(
		(ringIdx: number, newCoords: [number, number][]) => {
			// Ensure closed ring: first and last must be the same
			if (newCoords.length < 4) return; // at least 4 points
			if (
				newCoords.length < 2 ||
				newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
				newCoords[0][1] !== newCoords[newCoords.length - 1][1]
			) {
				newCoords = [...newCoords.slice(0, -1), newCoords[0]];
			}

			const newLines = polygon.polygon.map((line, i) =>
				i === ringIdx
					? new GeometryLine(
							newCoords.map(([lng, lat]) => new GeometryPoint([lng, lat])) as [
								GeometryPoint,
								GeometryPoint,
								...GeometryPoint[],
							],
						)
					: line,
			);

			const updated = new GeometryPolygon(
				newLines as [GeometryLine, ...GeometryLine[]],
			);

			setPolygon(updated);
			onChange(updated);
		},
	);

	// Add a new ring (duplicate first ring or make a square)
	const onAddRing = useStable(() => {
		const first = polygon.polygon[0];
		const coords: [number, number][] = first
			? first.coordinates.map(([lng, lat]) => [lng + 0.01, lat + 0.01])
			: [
					[0, 0],
					[0.01, 0],
					[0.01, 0.01],
					[0, 0.01],
					[0, 0],
				];

		const newLine = new GeometryLine(
			coords.map(([lng, lat]) => new GeometryPoint([lng, lat])) as [
				GeometryPoint,
				GeometryPoint,
				...GeometryPoint[],
			],
		);

		const newLines = [...polygon.polygon, newLine];
		const updated = new GeometryPolygon(
			newLines as [GeometryLine, ...GeometryLine[]],
		);

		setPolygon(updated);
		onChange(updated);
	});

	// Remove a ring
	const onRemoveRing = useStable((ringIdx: number) => {
		if (polygon.polygon.length <= 1) return;

		const newLines = polygon.polygon.filter((_, i) => i !== ringIdx);
		const updated = new GeometryPolygon(
			newLines as [GeometryLine, ...GeometryLine[]],
		);

		setPolygon(updated);
		onChange(updated);
	});

	// Add a point to a ring
	const onAddPoint = useStable((ringIdx: number) => {
		const line = polygon.polygon[ringIdx];
		const coords = line.coordinates;
		const last = coords[coords.length - 2] || coords[0];

		const newCoords = [
			...coords.slice(0, -1),
			[last[0] + 0.01, last[1] + 0.01],
			coords[coords.length - 1],
		] as [number, number][];

		updateRing(ringIdx, newCoords);
	});

	// Remove a point from a ring
	const onRemovePoint = useStable((ringIdx: number, ptIdx: number) => {
		const line = polygon.polygon[ringIdx];

		if (line.coordinates.length <= 4) return; // must have at least 4

		const newCoords = line.coordinates.filter((_, i) => i !== ptIdx) as [
			number,
			number,
		][];

		// Ensure closed
		if (
			newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
			newCoords[0][1] !== newCoords[newCoords.length - 1][1]
		) {
			newCoords[newCoords.length - 1] = [...newCoords[0]];
		}

		updateRing(ringIdx, newCoords);
	});

	// Update a single point in a ring
	const onChangePoint = useStable(
		(ringIdx: number, ptIdx: number, lng: number, lat: number) => {
			const line = polygon.polygon[ringIdx];

			const newCoords = line.coordinates.map((coord, i) =>
				i === ptIdx ? [lng, lat] : coord,
			) as [number, number][];

			if (
				newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
				newCoords[0][1] !== newCoords[newCoords.length - 1][1]
			) {
				newCoords[newCoords.length - 1] = [...newCoords[0]];
			}

			updateRing(ringIdx, newCoords);
		},
	);

	return (
		<Stack h="100%" flex={1} style={{ overflowY: "auto" }}>
			{polygon.polygon.map((line, ringIdx) => (
				<Stack key={ringIdx} p="sm">
					<Group align="center" mb={4}>
						<Text fw={600}>
							{ringIdx === 0 ? "Outer ring" : `Hole #${ringIdx}`}
						</Text>
						{polygon.polygon.length > 1 && (
							<ActionIcon
								color="red"
								onClick={() => onRemoveRing(ringIdx)}
								aria-label="Remove ring"
								size="lg"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						)}
					</Group>
					{line.coordinates.slice(0, -1).map(([lng, lat], ptIdx) => (
						<Group key={ptIdx} align="end" gap="xs">
							<NumberInput
								label={ptIdx === 0 ? "Longitude" : undefined}
								value={lng}
								step={0.000001}
								min={-180}
								max={180}
								onChange={(val) =>
									onChangePoint(ringIdx, ptIdx, Number(val), lat)
								}
								flex={1}
							/>
							<NumberInput
								label={ptIdx === 0 ? "Latitude" : undefined}
								value={lat}
								step={0.000001}
								min={-90}
								max={90}
								onChange={(val) =>
									onChangePoint(ringIdx, ptIdx, lng, Number(val))
								}
								flex={1}
							/>
							{line.coordinates.length > 4 && (
								<ActionIcon
									color="red"
									onClick={() => onRemovePoint(ringIdx, ptIdx)}
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
						onClick={() => onAddPoint(ringIdx)}
						variant="light"
						mt="sm"
					>
						Add point
					</Button>
					{ringIdx < polygon.polygon.length - 1 && <Divider my="sm" />}
				</Stack>
			))}
			<Button
				leftSection={<Icon path={iconPlus} />}
				onClick={onAddRing}
				variant="light"
				mt="sm"
			>
				Add ring (hole)
			</Button>
			<Text size="xs" c="dimmed">
				Polygon requires at least 1 closed ring (4+ points, first = last).
			</Text>
		</Stack>
	);
}
