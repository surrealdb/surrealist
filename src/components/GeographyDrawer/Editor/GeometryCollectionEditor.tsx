import {
	Group,
	Button,
	Stack,
	ActionIcon,
	Text,
	Divider,
	Select,
} from "@mantine/core";
import { useState } from "react";
import {
	GeometryCollection,
	GeometryPoint,
	GeometryLine,
	GeometryPolygon,
	GeometryMultiPoint,
	GeometryMultiLine,
	GeometryMultiPolygon,
} from "surrealdb";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { iconClose, iconPlus } from "~/util/icons";
import { GeometryPointEditor } from "./GeometryPointEditor";
import { GeometryLineEditor } from "./GeometryLineEditor";
import { GeometryPolygonEditor } from "./GeometryPolygonEditor";
import { GeometryMultiPointEditor } from "./GeometryMultiPointEditor";
import { GeometryMultiLineEditor } from "./GeometryMultiLineEditor";
import { GeometryMultiPolygonEditor } from "./GeometryMultiPolygonEditor";
import {
	isGeometryLineString,
	isGeometryMultiLine,
	isGeometryMultiPoint,
	isGeometryMultiPolygon,
	isGeometryPoint,
	isGeometryPolygon,
} from "../helpers";
import { GeographyInput } from "~/components/GeographyMap";

interface Props {
	value: GeometryCollection;
	onChange: (value: GeometryCollection) => void;
}

type GeometryType =
	| "Point"
	| "LineString"
	| "Polygon"
	| "MultiPoint"
	| "MultiLineString"
	| "MultiPolygon";

const GEOMETRY_TYPES: { value: GeometryType; label: string }[] = [
	{ value: "Point", label: "Point" },
	{ value: "LineString", label: "LineString" },
	{ value: "Polygon", label: "Polygon" },
	{ value: "MultiPoint", label: "MultiPoint" },
	{ value: "MultiLineString", label: "MultiLineString" },
	{ value: "MultiPolygon", label: "MultiPolygon" },
];

export function GeometryCollectionEditor({ value, onChange }: Props) {
	const [collection, setCollection] = useState<GeometryCollection>(value);

	// Create a new geometry of the specified type
	const createGeometry = (type: GeometryType) => {
		switch (type) {
			case "Point":
				return new GeometryPoint([0, 0]);
			case "LineString":
				return new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0.01, 0.01]),
				] as [GeometryPoint, GeometryPoint, ...GeometryPoint[]]);
			case "Polygon":
				const polygonLine = new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0.01, 0]),
					new GeometryPoint([0.01, 0.01]),
					new GeometryPoint([0, 0.01]),
					new GeometryPoint([0, 0]),
				] as [GeometryPoint, GeometryPoint, ...GeometryPoint[]]);
				return new GeometryPolygon([polygonLine] as [
					GeometryLine,
					...GeometryLine[],
				]);
			case "MultiPoint":
				return new GeometryMultiPoint([new GeometryPoint([0, 0])] as [
					GeometryPoint,
					...GeometryPoint[],
				]);
			case "MultiLineString":
				const multiLine = new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0.01, 0.01]),
				] as [GeometryPoint, GeometryPoint, ...GeometryPoint[]]);
				return new GeometryMultiLine([multiLine] as [
					GeometryLine,
					...GeometryLine[],
				]);
			case "MultiPolygon":
				const multiPolygonLine = new GeometryLine([
					new GeometryPoint([0, 0]),
					new GeometryPoint([0.01, 0]),
					new GeometryPoint([0.01, 0.01]),
					new GeometryPoint([0, 0.01]),
					new GeometryPoint([0, 0]),
				] as [GeometryPoint, GeometryPoint, ...GeometryPoint[]]);
				const multiPolygon = new GeometryPolygon([multiPolygonLine] as [
					GeometryLine,
					...GeometryLine[],
				]);
				return new GeometryMultiPolygon([multiPolygon] as [
					GeometryPolygon,
					...GeometryPolygon[],
				]);
			default:
				return new GeometryPoint([0, 0]);
		}
	};

	// Add a new geometry to the collection
	const onAddGeometry = useStable((type: GeometryType) => {
		const newGeometry = createGeometry(type);
		const newGeometries = [...collection.geometries, newGeometry];
		const updated = new GeometryCollection(newGeometries as any);
		setCollection(updated);
		onChange(updated); // Pass class instance, not GeoJSON
	});

	// Remove a geometry from the collection
	const onRemoveGeometry = useStable((index: number) => {
		if (collection.geometries.length <= 1) return;
		const newGeometries = collection.geometries.filter((_, i) => i !== index);
		const updated = new GeometryCollection(newGeometries as any);
		setCollection(updated);
		onChange(updated); // Pass class instance, not GeoJSON
	});

	// Update a geometry in the collection
	const onUpdateGeometry = useStable((index: number, newGeometry: any) => {
		// newGeometry is a class instance from the individual editors
		const newGeometries = collection.geometries.map((geom, i) =>
			i === index ? newGeometry : geom,
		);
		const updated = new GeometryCollection(newGeometries as any);
		setCollection(updated);
		onChange(updated); // Pass class instance, not GeoJSON
	});

	// Get the type name for a geometry
	const getGeometryType = (geometry: any): GeometryType => {
		if (isGeometryPoint(geometry)) return "Point";
		if (isGeometryLineString(geometry)) return "LineString";
		if (isGeometryPolygon(geometry)) return "Polygon";
		if (isGeometryMultiPoint(geometry)) return "MultiPoint";
		if (isGeometryMultiLine(geometry)) return "MultiLineString";
		if (isGeometryMultiPolygon(geometry)) return "MultiPolygon";
		return "Point";
	};

	return (
		<Stack h="100%" flex={1} style={{ overflowY: "auto" }}>
			{collection.geometries.map((geometry, index) => (
				<Stack key={index} p="sm">
					<Group align="center" mb={4}>
						<Text fw={600}>
							{getGeometryType(geometry)} #{index + 1}
						</Text>
						{collection.geometries.length > 1 && (
							<ActionIcon
								color="red"
								onClick={() => onRemoveGeometry(index)}
								aria-label="Remove geometry"
								size="lg"
							>
								<Icon path={iconClose} />
							</ActionIcon>
						)}
					</Group>
					{geometry instanceof GeometryPoint && (
						<GeometryPointEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{geometry instanceof GeometryLine && (
						<GeometryLineEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{geometry instanceof GeometryPolygon && (
						<GeometryPolygonEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{geometry instanceof GeometryMultiPoint && (
						<GeometryMultiPointEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{geometry instanceof GeometryMultiLine && (
						<GeometryMultiLineEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{geometry instanceof GeometryMultiPolygon && (
						<GeometryMultiPolygonEditor
							value={geometry}
							onChange={onUpdateGeometry.bind(null, index)}
						/>
					)}
					{index < collection.geometries.length - 1 && <Divider my="lg" />}
				</Stack>
			))}
			<Stack gap="xs">
				<Text size="sm" fw={500}>
					Add new geometry:
				</Text>
				<Group>
					<Select
						data={GEOMETRY_TYPES}
						placeholder="Select geometry type"
						defaultValue="Point"
						style={{ flex: 1 }}
						onChange={(value) => {
							if (value) {
								onAddGeometry(value as GeometryType);
							}
						}}
					/>
					<Button
						leftSection={<Icon path={iconPlus} />}
						onClick={() => onAddGeometry("Point")}
						variant="light"
					>
						Add
					</Button>
				</Group>
			</Stack>
			<Text size="xs" c="dimmed">
				GeometryCollection contains multiple geometries of different types.
			</Text>
		</Stack>
	);
}
