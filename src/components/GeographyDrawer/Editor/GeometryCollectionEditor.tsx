import {
	Group,
	Stack,
	ActionIcon,
	Text,
	Card,
	Select,
	Button,
	Tooltip,
	Divider,
} from "@mantine/core";
import { useState } from "react";
import { GeometryCollection } from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import {
	iconClose,
	iconPlus,
	iconChevronDown,
	iconGeometryCollection,
} from "~/util/icons";
import { GeometryPointEditor } from "./GeometryPointEditor";
import { GeometryLineEditor } from "./GeometryLineEditor";
import { GeometryPolygonEditor } from "./GeometryPolygonEditor";
import { GeometryMultiPointEditor } from "./GeometryMultiPointEditor";
import { GeometryMultiLineEditor } from "./GeometryMultiLineEditor";
import { GeometryMultiPolygonEditor } from "./GeometryMultiPolygonEditor";
import {
	convertGeoJSONToGeometry,
	normalizeGeometryArray,
	getGeometryTypeName,
	isGeometryLineString,
	isGeometryMultiLine,
	isGeometryMultiPoint,
	isGeometryMultiPolygon,
	isGeometryPoint,
	isGeometryPolygon,
	GeometryType,
	initializeGeometry,
} from "../helpers";
import { GeographyInput } from "~/components/GeographyMap";

interface Props {
	value: GeometryCollection;
	onChange: (value: GeometryCollection) => void;
}

const GEOMETRY_TYPES: { value: GeometryType; label: string }[] = [
	{ value: "Point", label: "Point" },
	{ value: "LineString", label: "LineString" },
	{ value: "Polygon", label: "Polygon" },
	{ value: "MultiPoint", label: "MultiPoint" },
	{ value: "MultiLineString", label: "MultiLineString" },
	{ value: "MultiPolygon", label: "MultiPolygon" },
];

function InnerEditor({
	geometry,
	onUpdateGeometry,
	index,
}: {
	geometry: GeoJSON.GeoJSON;
	onUpdateGeometry: (index: number, geometry: GeographyInput) => void;
	index: number;
}) {
	// Handle both GeoJSON and SurrealDB geometry objects
	if (isGeometryPoint(geometry)) {
		return (
			<GeometryPointEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	if (isGeometryLineString(geometry)) {
		return (
			<GeometryLineEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	if (isGeometryPolygon(geometry)) {
		return (
			<GeometryPolygonEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	if (isGeometryMultiPoint(geometry)) {
		return (
			<GeometryMultiPointEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	if (isGeometryMultiLine(geometry)) {
		return (
			<GeometryMultiLineEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	if (isGeometryMultiPolygon(geometry)) {
		return (
			<GeometryMultiPolygonEditor
				value={convertGeoJSONToGeometry(geometry)}
				onChange={(value) => onUpdateGeometry(index, value)}
			/>
		);
	}

	return <Text c="red">Unknown geometry type</Text>;
}

export function GeometryCollectionEditor({ value, onChange }: Props) {
	const [collection, setCollection] = useState<GeometryCollection>(value);
	const [selectedGeometryType, setSelectedGeometryType] =
		useState<GeometryType | null>(null);

	// Add a new geometry to the collection
	const onAddGeometry = useStable((type: GeometryType) => {
		const newGeometry = initializeGeometry(type);

		// Convert existing GeoJSON objects back to SurrealDB geometry objects
		const currentGeometries = normalizeGeometryArray(
			Array.from(collection.geometries) as any[],
		) as GeographyInput[];

		const newGeometries = [...currentGeometries, newGeometry];
		const updated = new GeometryCollection(
			newGeometries as [GeographyInput, ...GeographyInput[]],
		);
		setCollection(updated);
		onChange(updated);
	});

	// Update a specific geometry in the collection
	const onUpdateGeometry = useStable(
		(index: number, geometry: GeographyInput) => {
			// Normalize any GeoJSON or Surreal instances to Surreal geometry instances
			const currentGeometries = normalizeGeometryArray(
				Array.from(collection.geometries) as any[],
			) as GeographyInput[];

			const newGeometries = currentGeometries.map((geom, i) =>
				i === index ? geometry : geom,
			);
			const updated = new GeometryCollection(
				newGeometries as [GeographyInput, ...GeographyInput[]],
			);
			setCollection(updated);
			onChange(updated);
		},
	);

	// Remove a geometry from the collection
	const onRemoveGeometry = useStable((index: number) => {
		if (collection.geometries.length <= 1) return;

		// Normalize any GeoJSON or Surreal instances to Surreal geometry instances
		const currentGeometries = normalizeGeometryArray(
			Array.from(collection.geometries) as any[],
		) as GeographyInput[];

		const newGeometries = currentGeometries.filter((_, i) => i !== index);
		const updated = new GeometryCollection(
			newGeometries as [GeographyInput, ...GeographyInput[]],
		);
		setCollection(updated);
		onChange(updated);
	});

	return (
		<Stack gap="md">
			<Card withBorder bg="#1E1B2E" p="md" radius="md">
				<Group justify="space-between" mb="md">
					<Group gap="xs">
						<Icon path={iconGeometryCollection} size="sm" />
						<Text size="sm" fw={500} c="bright">
							GeometryCollection
						</Text>
					</Group>
					<Text size="xs" c="dimmed">
						{collection.geometries.length} geometries
					</Text>
				</Group>

				<Stack gap="md">
					{collection.geometries.map((geometry, index) => (
						<Card key={index} withBorder bg="#252138" p="md" radius="md">
							<Group justify="space-between" mb="md">
								<Group gap="xs">
									<Text size="sm" fw={500} c="bright">
										{getGeometryTypeName(geometry)}
									</Text>
									<Text size="xs" c="dimmed">
										#{index + 1}
									</Text>
								</Group>
								{collection.geometries.length > 1 && (
									<Tooltip label="Remove geometry">
										<ActionIcon
											variant="subtle"
											color="red"
											onClick={() => onRemoveGeometry(index)}
											aria-label="Remove geometry"
											size="sm"
										>
											<Icon path={iconClose} size="xs" />
										</ActionIcon>
									</Tooltip>
								)}
							</Group>
							<InnerEditor
								geometry={geometry}
								onUpdateGeometry={onUpdateGeometry}
								index={index}
							/>
						</Card>
					))}
				</Stack>

				<Divider my="md" />

				<Group gap="sm" align="end">
					<Select
						label="Add geometry type"
						placeholder="Select a type to add"
						value={selectedGeometryType}
						onChange={(value) => setSelectedGeometryType(value as GeometryType)}
						data={GEOMETRY_TYPES.map((t) => ({
							value: t.value,
							label: t.label,
						}))}
						size="sm"
						flex={1}
						rightSection={<Icon path={iconChevronDown} size="xs" />}
						rightSectionPointerEvents="none"
					/>
					<Button
						leftSection={<Icon path={iconPlus} size="xs" />}
						onClick={() => {
							if (selectedGeometryType) {
								onAddGeometry(selectedGeometryType);
								setSelectedGeometryType(null);
							}
						}}
						disabled={!selectedGeometryType}
						variant="default"
						size="sm"
					>
						Add
					</Button>
				</Group>

				<Text size="xs" c="dimmed">
					GeometryCollection can contain multiple different geometry types.
					Choose a type from the dropdown and click Add to create complex
					spatial data structures.
				</Text>
			</Card>
		</Stack>
	);
}
