import 'leaflet/dist/leaflet.css';

import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { LatLng, Map, geoJSON as createGeoJSON, latLng } from "leaflet";
import { Overlay, Paper } from '@mantine/core';
import { parseValue } from "~/util/surrealql";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "surrealdb.js";
import { useEffect, useRef, useState } from 'react';

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2 from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (window.L.Icon.Default.prototype as any)._getIconUrl;

window.L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2,
	iconUrl: markerIcon,
	shadowUrl: markerShadow
});

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

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = latLng(51.515_449_578_195_174, -0.139_976_602_926_186_13);

const PLACEHOLDER = {
	type: "FeatureCollection", features: []
};

export type GeographyMapProps = {
	value: string;
};

export const GeographyMap = ({ value }: GeographyMapProps) => {
	const ref = useRef<Map>(null);

	const [data, setData] = useState<any>(PLACEHOLDER);
	const [isError, setIsError] = useState(false);
	const [bounds, setBounds] = useState<any>();

	useEffect(() => {
		try {
			const data = parseValue(value).toJSON();

			const leafletGeoJson = createGeoJSON(data, {
				coordsToLatLng: convertCoordsToLatLng
			});

			setIsError(false);
			setData(leafletGeoJson.toGeoJSON());
			setBounds(leafletGeoJson.getBounds());
		} catch {
			setIsError(true);
		}
	}, [value]);

	useEffect(() => {
		ref.current?.fitBounds(bounds);
	}, [bounds]);

	const isPlaceholderData = data === PLACEHOLDER;

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
				height: "100%",
			}}
		>
			{isError ? (
				<Overlay
					gradient="linear-gradient(145deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0) 100%)"
					opacity={0.85}
					style={{ display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
				>
					Failed to parse value
				</Overlay>
			) : null}

			<MapContainer
				ref={ref}
				zoom={DEFAULT_ZOOM}
				center={DEFAULT_CENTER}
				scrollWheelZoom={false}
				attributionControl={false}
				style={{
					width: "100%",
					height: "inherit",
					borderRadius: "inherit",
				}}
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<GeoJSON key={isPlaceholderData ? null : value} data={data} />
			</MapContainer>
		</Paper>
	);
};

export default GeographyMap;