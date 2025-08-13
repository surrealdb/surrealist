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
import {
	GeometryMultiPolygon,
	GeometryPolygon,
	GeometryLine,
	GeometryPoint,
} from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus, iconGeometryMultiPolygon } from "~/util/icons";

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
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group justify="space-between" mb="md">
					<Group gap="xs">
						<Icon path={iconGeometryMultiPolygon} size="sm" />
						<Text size="sm" fw={500} c="bright">
							MultiPolygon collection
						</Text>
					</Group>
					<Group gap="xs">
						<Text size="xs" c="dimmed">
							{multiPolygon.polygons.length} polygons
						</Text>
						<Tooltip label="Add Polygon">
							<ActionIcon
								variant="subtle"
								size="sm"
								onClick={onAddPolygon}
								aria-label="Add polygon"
							>
								<Icon path={iconPlus} size="xs" />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>

				<Stack gap="lg">
					{multiPolygon.polygons.map((polygon, polyIdx) => (
						<Card key={polyIdx} withBorder bg="#252138" p="md" radius="md">
							<Group justify="space-between" mb="md">
								<Badge
									variant="outline"
									color="gray"
									size="md"
									radius="sm"
									styles={{
										root: {
											backgroundColor: "#553C9A",
											borderColor: "#8B5CF6",
											color: "#F5F3FF",
										},
									}}
								>
									Polygon #{polyIdx + 1}
								</Badge>
								<Group gap="xs">
									<Text size="xs" c="dimmed">
										{polygon.polygon.length} rings
									</Text>
									<Tooltip label="Add hole/inner ring">
										<ActionIcon
											variant="subtle"
											size="xs"
											onClick={() => onAddRing(polyIdx)}
											aria-label="Add ring"
										>
											<Icon path={iconPlus} size="xs" />
										</ActionIcon>
									</Tooltip>
									{multiPolygon.polygons.length > 1 && (
										<Tooltip label="Remove polygon">
											<ActionIcon
												variant="subtle"
												color="red"
												size="xs"
												onClick={() => onRemovePolygon(polyIdx)}
												aria-label="Remove polygon"
											>
												<Icon path={iconClose} size="xs" />
											</ActionIcon>
										</Tooltip>
									)}
								</Group>
							</Group>

							<Stack gap="md">
								{polygon.polygon.map((line, ringIdx) => (
									<Card
										key={ringIdx}
										withBorder
										bg="#2B2742"
										p="sm"
										radius="sm"
									>
										<Group justify="space-between" mb="sm">
											<Badge
												variant="outline"
												color={ringIdx === 0 ? "gray" : "dark"}
												size="sm"
												radius="sm"
												styles={{
													root: {
														backgroundColor:
															ringIdx === 0 ? "#4C4A5E" : "#5A5770",
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
														onClick={() => onAddPoint(polyIdx, ringIdx)}
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
															onClick={() => onRemoveRing(polyIdx, ringIdx)}
															aria-label="Remove ring"
														>
															<Icon path={iconClose} size="xs" />
														</ActionIcon>
													</Tooltip>
												)}
											</Group>
										</Group>

										<Stack gap="xs">
											{line.coordinates
												.slice(0, -1)
												.map(([lng, lat], ptIdx) => (
													<Group key={ptIdx} align="end" gap="xs" wrap="nowrap">
														<NumberInput
															label={ptIdx === 0 ? "Longitude" : undefined}
															value={lng}
															step={0.000001}
															min={-180}
															max={180}
															allowNegative
															size="sm"
															decimalScale={6}
															fixedDecimalScale={false}
															placeholder="0.000000"
															onChange={(val) =>
																onChangePoint(
																	polyIdx,
																	ringIdx,
																	ptIdx,
																	Number(val),
																	lat,
																)
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
															decimalScale={6}
															fixedDecimalScale={false}
															placeholder="0.000000"
															onChange={(val) =>
																onChangePoint(
																	polyIdx,
																	ringIdx,
																	ptIdx,
																	lng,
																	Number(val),
																)
															}
															flex={1}
														/>
														{line.coordinates.length > 4 && (
															<Tooltip label="Remove point">
																<ActionIcon
																	variant="subtle"
																	color="red"
																	onClick={() =>
																		onRemovePoint(polyIdx, ringIdx, ptIdx)
																	}
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
						</Card>
					))}
				</Stack>

				<Divider my="md" />
				<Text size="xs" c="dimmed">
					MultiPolygon contains multiple Polygons. Each Polygon consists of
					closed rings where the outer boundary defines the shape and inner
					rings create holes. Each ring requires at least 4 points (first and
					last must be identical).
				</Text>
			</Card>
		</Stack>
	);
}
