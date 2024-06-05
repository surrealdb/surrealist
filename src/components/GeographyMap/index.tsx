import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { LatLng, geoJSON, latLng } from "leaflet";
import 'leaflet/dist/leaflet.css';
import { Paper } from '@mantine/core';
import { parseValue } from "~/util/surrealql";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "surrealdb.js";
import { useIsLight } from '~/hooks/theme';

export type GeographyInput =
	| GeometryPoint
	| GeometryLine
	| GeometryPolygon
	| GeometryMultiPoint
	| GeometryMultiLine
	| GeometryMultiPolygon
	| GeometryCollection<any>;

const convertCoordsToLatLng = (point: [number, number] | [number, number, number]): LatLng => {
	return latLng({ lat: point[1], lng: point[0] });
};

export type GeographyMapProps = {
	value: string;
};

export const GeographyMap = ({ value }: GeographyMapProps) => {
	const data = parseValue(value).toJSON();

	const leafletGeoJson = geoJSON(data, {
		coordsToLatLng: convertCoordsToLatLng
	});
	const leafletCenter = leafletGeoJson.getBounds().getCenter();
	const zoom = data.type === "Point" ? 14 : 10;

	const isLight = useIsLight();

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
				style={{
					width: "100%",
					height: "inherit",
					borderRadius: "inherit",
					filter: isLight ? "none" : "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)",
				}}
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