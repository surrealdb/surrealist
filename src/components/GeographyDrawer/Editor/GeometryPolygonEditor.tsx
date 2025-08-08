import {
	Group,
	NumberInput,
	Button,
	Stack,
	ActionIcon,
	Text,
	Divider,
	Badge,
	Box,
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
				<Box
					key={ringIdx}
					pos="relative"
					p="sm"
					mt="xs"
					style={{
						border: "1px solid var(--mantine-color-slate-6, #2f3747)",
						borderRadius: 8,
					}}
				>
					<Badge
						variant="light"
						color="slate"
						radius="sm"
						style={{ position: "absolute", top: -10, left: 12 }}
					>
						{ringIdx === 0 ? "Outer" : "Inner"}
					</Badge>
					<Group justify="flex-end" mb={4}>
						{polygon.polygon.length > 1 && (
							<ActionIcon
								variant="subtle"
								color="slate"
								onClick={() => onRemoveRing(ringIdx)}
								aria-label="Remove ring"
								size="sm"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						)}
					</Group>
					<Stack>
						{line.coordinates.slice(0, -1).map(([lng, lat], ptIdx) => (
							<Group key={ptIdx} align="end" gap="xs">
								<Badge size="sm" variant="light" color="slate" radius="sm">
									#{ptIdx + 1}
								</Badge>
								<NumberInput
									label={ptIdx === 0 ? "Longitude" : undefined}
									value={lng}
									step={0.000001}
									min={-180}
									max={180}
									size="sm"
									allowNegative
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
									onChange={(val) =>
										onChangePoint(ringIdx, ptIdx, lng, Number(val))
									}
									flex={1}
								/>
								{line.coordinates.length > 4 && (
									<ActionIcon
										variant="subtle"
										color="slate"
										onClick={() => onRemovePoint(ringIdx, ptIdx)}
										aria-label="Remove point"
										size="md"
										mt={-1}
									>
										<Icon path={iconClose} />
									</ActionIcon>
								)}
							</Group>
						))}
					</Stack>
					<Group justify="space-between" mt="md">
						<Text size="xs" c="slate">
							Closed ring requires at least 4 points (first = last)
						</Text>
						<Button
							leftSection={<Icon path={iconPlus} />}
							onClick={() => onAddPoint(ringIdx)}
							variant="default"
							size="xs"
						>
							Add point
						</Button>
					</Group>
					{ringIdx < polygon.polygon.length - 1 && <Divider my="sm" />}
				</Box>
			))}
			<Group justify="space-between" mt="md">
				<Text size="xs" c="slate">
					Add holes to represent inner boundaries.
				</Text>
				<Button
					leftSection={<Icon path={iconPlus} />}
					onClick={onAddRing}
					variant="default"
					size="xs"
				>
					Add ring (hole)
				</Button>
			</Group>
			<Text size="xs" c="dimmed">
				Polygon requires at least 1 closed ring (4+ points, first = last).
			</Text>
		</Stack>
	);
}
