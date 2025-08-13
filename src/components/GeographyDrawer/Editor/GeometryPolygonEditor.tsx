import {
	Group,
	NumberInput,
	Stack,
	ActionIcon,
	Text,
	Badge,
	Card,
	Tooltip,
	Divider,
} from "@mantine/core";
import { useState } from "react";
import { GeometryPolygon, GeometryLine, GeometryPoint } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus, iconGeometryPolygon } from "~/util/icons";

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
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group justify="space-between" mb="md">
					<Group gap="xs">
						<Icon path={iconGeometryPolygon} size="sm" />
						<Text size="sm" fw={500} c="bright">
							Polygon rings
						</Text>
					</Group>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{polygon.polygon.length} rings
						</Text>
						<Tooltip label="Add hole/inner ring">
							<ActionIcon
								variant="subtle"
								size="sm"
								onClick={onAddRing}
								aria-label="Add ring"
							>
								<Icon path={iconPlus} size="xs" />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>

				<Stack gap="md">
					{polygon.polygon.map((line, ringIdx) => (
						<Card key={ringIdx} withBorder bg="#252138" p="sm" radius="sm">
							<Group justify="space-between" mb="sm">
								<Badge
									variant="outline"
									color={ringIdx === 0 ? "gray" : "dark"}
									size="sm"
									radius="sm"
									styles={{
										root: {
											backgroundColor: ringIdx === 0 ? "#4C4A5E" : "#5A5770",
											borderColor: ringIdx === 0 ? "#6B6B8A" : "#8B8AA3",
											color: "#F5F5F9",
										},
									}}
								>
									{ringIdx === 0 ? "Outer boundary" : `Hole ${ringIdx}`}
								</Badge>
								<Group gap="xs">
									<Text size="xs" c="dimmed">
										{line.coordinates.length - 1} points
									</Text>
									<Tooltip label="Add point to ring">
										<ActionIcon
											variant="subtle"
											size="xs"
											onClick={() => onAddPoint(ringIdx)}
											aria-label="Add point"
										>
											<Icon path={iconPlus} size="xs" />
										</ActionIcon>
									</Tooltip>
									{polygon.polygon.length > 1 && (
										<Tooltip label="Remove ring">
											<ActionIcon
												variant="subtle"
												color="red"
												size="xs"
												onClick={() => onRemoveRing(ringIdx)}
												aria-label="Remove ring"
											>
												<Icon path={iconClose} size="xs" />
											</ActionIcon>
										</Tooltip>
									)}
								</Group>
							</Group>

							<Stack gap="xs">
								{line.coordinates.slice(0, -1).map(([lng, lat], ptIdx) => (
									<Group key={ptIdx} align="end" gap="xs" wrap="nowrap">
										<NumberInput
											label={ptIdx === 0 ? "Longitude" : undefined}
											value={lng}
											step={0.000001}
											min={-180}
											max={180}
											size="sm"
											allowNegative
											decimalScale={6}
											fixedDecimalScale={false}
											placeholder="0.000000"
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
											size="sm"
											allowNegative
											decimalScale={6}
											fixedDecimalScale={false}
											placeholder="0.000000"
											onChange={(val) =>
												onChangePoint(ringIdx, ptIdx, lng, Number(val))
											}
											flex={1}
										/>
										{line.coordinates.length > 4 && (
											<Tooltip label="Remove point">
												<ActionIcon
													variant="subtle"
													color="red"
													onClick={() => onRemovePoint(ringIdx, ptIdx)}
													aria-label="Remove point"
													size="sm"
													mt={ptIdx === 0 ? "xl" : undefined}
												>
													<Icon path={iconClose} size="xs" />
												</ActionIcon>
											</Tooltip>
										)}
									</Group>
								))}
							</Stack>
						</Card>
					))}
				</Stack>

				<Divider my="sm" />
				<Text size="xs" c="dimmed">
					Polygon consists of closed rings. The outer boundary defines the
					shape, inner rings create holes. Each ring requires at least 4 points
					(first and last must be identical).
				</Text>
			</Card>
		</Stack>
	);
}
