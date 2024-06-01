import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { LatLng, geoJSON, latLng } from "leaflet";
import 'leaflet/dist/leaflet.css';
import { Paper } from '@mantine/core';
import { parseValue } from "~/util/surrealql";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "surrealdb.js";

export type GeographyInput =
	| GeometryPoint
	| GeometryLine
	| GeometryPolygon
	| GeometryMultiPoint
	| GeometryMultiLine
	| GeometryMultiPolygon
	| GeometryCollection<any>;

const toGeoPoint = (data: GeometryPoint) => {
	const [long, lat] = data.point;
	return [long.toNumber(), lat.toNumber()] as const;
};

const toGeoJSONObject = (input: GeographyInput): any => {
	if (input instanceof GeometryPoint) {
		return {
			type: "Point",
			coordinates: toGeoPoint(input),
		};
	}
	if (input instanceof GeometryLine) {
		return {
			type: "LineString",
			coordinates: input.line.map(p => toGeoPoint(p)),
		};
	}
	if (input instanceof GeometryPolygon) {
		return {
			type: "Polygon",
			coordinates: input.polygon.map(ring => ring.line.map(p => toGeoPoint(p))),
		};
	}
	if (input instanceof GeometryMultiPoint) {
		return {
			type: "MultiPoint",
			coordinates: input.points.map(p => toGeoPoint(p)),
		};
	}
	if (input instanceof GeometryMultiLine) {
		return {
			type: "MultiLineString",
			coordinates: input.lines.map(l => l.line.map(p => toGeoPoint(p))),
		};
	}
	if (input instanceof GeometryMultiPolygon) {
		return {
			type: "MultiPolygon",
			coordinates: input.polygons.map(p => p.polygon.map(ring => ring.line.map(p => toGeoPoint(p)))),
		};
	}
	if (input instanceof GeometryCollection) {
		return {
			type: "GeometryCollection",
			geometries: input.collection.map((c: GeographyInput) => toGeoJSONObject(c)),
		};
	}
};

const convertCoordsToLatLng = (point: [number, number] | [number, number, number]): LatLng => {
	return latLng({ lat: point[1], lng: point[0] });
};

export type GeographyMapProps = {
	value: string;
};

export const GeographyMap = ({ value }: GeographyMapProps) => {
	const data = toGeoJSONObject(parseValue(value));
	console.warn("data", data);

	const leafletGeoJson = geoJSON(data, {
		coordsToLatLng: convertCoordsToLatLng
	});
	const leafletCenter = leafletGeoJson.getBounds().getCenter();
	const zoom = data.type === "Point" ? 14 : 10;

	return (
		<Paper
			radius="md"
			my="md"
			pos="relative"
			style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "380px",
			}}
		>
			<MapContainer
				zoom={zoom}
				center={leafletCenter}
				style={{ width: "100%", height: "inherit", borderRadius: "inherit" }}
				scrollWheelZoom={false}
				attributionControl={false}
			>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<GeoJSON key={value} data={leafletGeoJson.toGeoJSON()} />
			</MapContainer>
		</Paper>
	);
};

export default GeographyMap;