import "leaflet/dist/leaflet.css";

import { Overlay, Paper } from "@mantine/core";
import { geoJSON as createGeoJSON, type Map as GeoMap, type LatLng, latLng } from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2 from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useEffect, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import type {
	GeometryCollection,
	GeometryLine,
	GeometryMultiLine,
	GeometryMultiPoint,
	GeometryMultiPolygon,
	GeometryPoint,
	GeometryPolygon,
} from "surrealdb";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";

// leaflet is a tragedy
delete (window.L.Icon.Default.prototype as any)._getIconUrl;

window.L.Icon.Default.mergeOptions({
	iconRetinaUrl: markerIcon2,
	iconUrl: markerIcon,
	shadowUrl: markerShadow,
});

export type GeographyInput =
	| GeometryPoint
	| GeometryLine
	| GeometryPolygon
	| GeometryMultiPoint
	| GeometryMultiLine
	| GeometryMultiPolygon
	| GeometryCollection;

const convertCoordsToLatLng = (point: [number, number] | [number, number, number]): LatLng => {
	return latLng({ lat: point[1], lng: point[0] });
};

const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = latLng(51.515_449_578_195_174, -0.139_976_602_926_186_13);

const PLACEHOLDER = {
	type: "FeatureCollection",
	features: [],
};

export type GeographyMapProps = {
	value: string;
};

export const GeographyMap = ({ value }: GeographyMapProps) => {
	const ref = useRef<GeoMap>(null);

	const [data, setData] = useState<any>(PLACEHOLDER);
	const [isError, setIsError] = useState(false);
	const [bounds, setBounds] = useState<any>();

	useEffect(() => {
		let cancelled = false;

		const loadData = async () => {
			try {
				const data = (await getSurrealQL().parseValue<any>(value)).toJSON();

				if (cancelled) return;

				const leafletGeoJson = createGeoJSON(data, {
					coordsToLatLng: convertCoordsToLatLng,
				});

				setIsError(false);
				setData(leafletGeoJson.toGeoJSON());
				setBounds(leafletGeoJson.getBounds());
			} catch {
				if (!cancelled) {
					setIsError(true);
				}
			}
		};

		loadData();

		return () => {
			cancelled = true;
		};
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
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						zIndex: 1000,
					}}
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
				<GeoJSON
					key={isPlaceholderData ? null : value}
					data={data}
				/>
			</MapContainer>
		</Paper>
	);
};

export default GeographyMap;
