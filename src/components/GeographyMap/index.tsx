import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { LatLng, geoJSON as createGeoJSON, latLng } from "leaflet";
import 'leaflet/dist/leaflet.css';
import { Overlay, Paper } from '@mantine/core';
import { parseValue } from "~/util/surrealql";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "surrealdb.js";
import { useIsLight } from '~/hooks/theme';
import { useEffect, useState } from 'react';

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

type GeographyMapData = {
	geoJSON: any;
	zoom: number;
	center: LatLng;
};

const placeholderData: GeographyMapData = {
	geoJSON: { type: "FeatureCollection", features: [] },
	zoom: 15,
	center: latLng(51.515_449_578_195_174, -0.139_976_602_926_186_13)
};

export type GeographyMapProps = {
	value: string;
};

export const GeographyMap = ({ value }: GeographyMapProps) => {
	const isLight = useIsLight();

	const [data, setData] = useState(placeholderData);
	const [isError, setIsError] = useState(false);

	useEffect(() => {
		try {
			const data = parseValue(value).toJSON();

			const leafletGeoJson = createGeoJSON(data, {
				coordsToLatLng: convertCoordsToLatLng
			});
			const center = leafletGeoJson.getBounds().getCenter();
			const zoom = data.type === "Point" ? 14 : 10;

			setIsError(false);
			setData({ geoJSON: leafletGeoJson.toGeoJSON(), zoom, center });
		} catch {
			setIsError(true);
		}
	}, [value]);

	const isPlaceholderData = data === placeholderData;
	const { geoJSON, zoom, center } = data;

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
					style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
				>
					Failed to parse value
				</Overlay>
			) : null}

			<MapContainer
				key={isPlaceholderData ? "placeholder" : "map"}
				zoom={zoom}
				center={center}
				style={{
					width: "100%",
					height: "inherit",
					borderRadius: "inherit",
					filter: isLight ? "none" : "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)",
				}}
				scrollWheelZoom={false}
				attributionControl={false}
			>
				<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
				<GeoJSON key={isPlaceholderData ? null : value} data={geoJSON} />
			</MapContainer>
		</Paper>
	);
};

export default GeographyMap;