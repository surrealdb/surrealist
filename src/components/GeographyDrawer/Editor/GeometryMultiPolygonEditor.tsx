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
import {
	GeometryMultiPolygon,
	GeometryPolygon,
	GeometryLine,
	GeometryPoint,
} from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";

interface Props {
	value: GeometryMultiPolygon;
	onChange: (value: GeometryMultiPolygon) => void;
}

export function GeometryMultiPolygonEditor({ value, onChange }: Props) {
	const [multiPolygon, setMultiPolygon] = useState<GeometryMultiPolygon>(value);

	// Helper to update a ring in a specific polygon
	const updateRing = useStable(
		(polyIdx: number, ringIdx: number, newCoords: [number, number][]) => {
			// Ensure closed ring: first and last must be the same
			if (newCoords.length < 4) return; // GeoJSON: at least 4 points (first == last)
			if (
				newCoords.length < 2 ||
				newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
				newCoords[0][1] !== newCoords[newCoords.length - 1][1]
			) {
				newCoords = [...newCoords.slice(0, -1), newCoords[0]];
			}

			const polygon = multiPolygon.polygons[polyIdx];
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

			const newPolygons = multiPolygon.polygons.map((poly, i) =>
				i === polyIdx
					? new GeometryPolygon(newLines as [GeometryLine, ...GeometryLine[]])
					: poly,
			);

			const updated = new GeometryMultiPolygon(
				newPolygons as [GeometryPolygon, ...GeometryPolygon[]],
			);
			setMultiPolygon(updated);
			onChange(updated); // Pass class instance, not GeoJSON
		},
	);

	// Add a new polygon
	const onAddPolygon = useStable(() => {
		// Create a simple square polygon
		const coords: [number, number][] = [
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
		const newPolygon = new GeometryPolygon([newLine] as [
			GeometryLine,
			...GeometryLine[],
		]);

		const newPolygons = [...multiPolygon.polygons, newPolygon];
		const updated = new GeometryMultiPolygon(
			newPolygons as [GeometryPolygon, ...GeometryPolygon[]],
		);
		setMultiPolygon(updated);
		onChange(updated);
	});

	// Remove a polygon
	const onRemovePolygon = useStable((polyIdx: number) => {
		if (multiPolygon.polygons.length <= 1) return;
		const newPolygons = multiPolygon.polygons.filter((_, i) => i !== polyIdx);
		const updated = new GeometryMultiPolygon(
			newPolygons as [GeometryPolygon, ...GeometryPolygon[]],
		);
		setMultiPolygon(updated);
		onChange(updated);
	});

	// Add a new ring to a polygon
	const onAddRing = useStable((polyIdx: number) => {
		const polygon = multiPolygon.polygons[polyIdx];
		const first = polygon.polygon[0];
		let coords: [number, number][];
		if (first) {
			coords = first.coordinates.map(([lng, lat]) => [lng + 0.01, lat + 0.01]);
		} else {
			coords = [
				[0, 0],
				[0.01, 0],
				[0.01, 0.01],
				[0, 0.01],
				[0, 0],
			];
		}
		const newLine = new GeometryLine(
			coords.map(([lng, lat]) => new GeometryPoint([lng, lat])) as [
				GeometryPoint,
				GeometryPoint,
				...GeometryPoint[],
			],
		);
		const newLines = [...polygon.polygon, newLine];
		const newPolygon = new GeometryPolygon(
			newLines as [GeometryLine, ...GeometryLine[]],
		);

		const newPolygons = multiPolygon.polygons.map((poly, i) =>
			i === polyIdx ? newPolygon : poly,
		);
		const updated = new GeometryMultiPolygon(
			newPolygons as [GeometryPolygon, ...GeometryPolygon[]],
		);
		setMultiPolygon(updated);
		onChange(updated);
	});

	// Remove a ring from a polygon
	const onRemoveRing = useStable((polyIdx: number, ringIdx: number) => {
		const polygon = multiPolygon.polygons[polyIdx];
		if (polygon.polygon.length <= 1) return;
		const newLines = polygon.polygon.filter((_, i) => i !== ringIdx);
		const newPolygon = new GeometryPolygon(
			newLines as [GeometryLine, ...GeometryLine[]],
		);

		const newPolygons = multiPolygon.polygons.map((poly, i) =>
			i === polyIdx ? newPolygon : poly,
		);
		const updated = new GeometryMultiPolygon(
			newPolygons as [GeometryPolygon, ...GeometryPolygon[]],
		);
		setMultiPolygon(updated);
		onChange(updated);
	});

	// Add a point to a ring
	const onAddPoint = useStable((polyIdx: number, ringIdx: number) => {
		const polygon = multiPolygon.polygons[polyIdx];
		const line = polygon.polygon[ringIdx];
		const coords = line.coordinates;
		const last = coords[coords.length - 2] || coords[0];
		const newCoords = [
			...coords.slice(0, -1),
			[last[0] + 0.01, last[1] + 0.01],
			coords[coords.length - 1],
		] as [number, number][];
		updateRing(polyIdx, ringIdx, newCoords);
	});

	// Remove a point from a ring
	const onRemovePoint = useStable(
		(polyIdx: number, ringIdx: number, ptIdx: number) => {
			const polygon = multiPolygon.polygons[polyIdx];
			const line = polygon.polygon[ringIdx];
			if (line.coordinates.length <= 4) return; // must have at least 4 (closed)
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
			updateRing(polyIdx, ringIdx, newCoords);
		},
	);

	// Update a single point in a ring
	const onChangePoint = useStable(
		(
			polyIdx: number,
			ringIdx: number,
			ptIdx: number,
			lng: number,
			lat: number,
		) => {
			const polygon = multiPolygon.polygons[polyIdx];
			const line = polygon.polygon[ringIdx];
			const newCoords = line.coordinates.map((coord, i) =>
				i === ptIdx ? [lng, lat] : coord,
			) as [number, number][];
			// Ensure closed
			if (
				newCoords[0][0] !== newCoords[newCoords.length - 1][0] ||
				newCoords[0][1] !== newCoords[newCoords.length - 1][1]
			) {
				newCoords[newCoords.length - 1] = [...newCoords[0]];
			}
			updateRing(polyIdx, ringIdx, newCoords);
		},
	);

	return (
		<Stack h="100%" flex={1} style={{ overflowY: "auto" }}>
			{multiPolygon.polygons.map((polygon, polyIdx) => (
				<Stack key={polyIdx} p="sm">
					<Group align="center" mb={4}>
						<Badge variant="light" color="slate" radius="sm">
							Polygon #{polyIdx + 1}
						</Badge>
						{multiPolygon.polygons.length > 1 && (
							<ActionIcon
								variant="subtle"
								color="slate"
								onClick={() => onRemovePolygon(polyIdx)}
								aria-label="Remove polygon"
								size="sm"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						)}
					</Group>
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
										onClick={() => onRemoveRing(polyIdx, ringIdx)}
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
										<NumberInput
											label={ptIdx === 0 ? "Longitude" : undefined}
											value={lng}
											step={0.000001}
											min={-180}
											max={180}
											allowNegative
											size="sm"
											onChange={(val) =>
												onChangePoint(polyIdx, ringIdx, ptIdx, Number(val), lat)
											}
											flex={1}
										/>
										<NumberInput
											label={ptIdx === 0 ? "Latitude" : undefined}
											value={lat}
											step={0.000001}
											min={-90}
											max={90}
											allowNegative
											size="sm"
											onChange={(val) =>
												onChangePoint(polyIdx, ringIdx, ptIdx, lng, Number(val))
											}
											flex={1}
										/>
										{line.coordinates.length > 4 && (
											<ActionIcon
												variant="subtle"
												color="slate"
												onClick={() => onRemovePoint(polyIdx, ringIdx, ptIdx)}
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
									onClick={() => onAddPoint(polyIdx, ringIdx)}
									variant="default"
									size="xs"
								>
									Add point
								</Button>
							</Group>
							{ringIdx < polygon.polygon.length - 1 && <Divider my="sm" />}
						</Box>
					))}
					<Group justify="space-between" mt="xs">
						<Text size="xs" c="slate">
							Add holes to represent inner boundaries.
						</Text>
						<Button
							leftSection={<Icon path={iconPlus} />}
							onClick={() => onAddRing(polyIdx)}
							variant="default"
							size="xs"
						>
							Add ring (hole)
						</Button>
					</Group>
					{polyIdx < multiPolygon.polygons.length - 1 && <Divider my="lg" />}
				</Stack>
			))}
			<Group justify="space-between" mt="md">
				<Text size="xs" c="slate">
					Add additional polygons to the collection.
				</Text>
				<Button
					leftSection={<Icon path={iconPlus} />}
					onClick={onAddPolygon}
					variant="default"
					size="xs"
				>
					Add polygon
				</Button>
			</Group>
			<Text size="xs" c="dimmed">
				MultiPolygon contains multiple Polygons. Each Polygon requires at least
				1 closed ring (4+ points, first = last).
			</Text>
		</Stack>
	);
}
