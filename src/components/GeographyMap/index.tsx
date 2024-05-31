import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { LatLngTuple, Icon as LeafletIcon } from "leaflet";
import 'leaflet/dist/leaflet.css';
import markerIconPng from "leaflet/dist/images/marker-icon.png";
import { GeometryPoint } from 'surrealdb.js';
import { Paper } from '@mantine/core';

const markerIcon = new LeafletIcon({
	iconUrl: markerIconPng,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

export type GeographyMapProps = {
	data: GeometryPoint
};

export const GeographyMap = ({ data }: GeographyMapProps) => {
	const [long, lat] = data.point;
	const point = [lat.toNumber(), long.toNumber()] as LatLngTuple;

	return <Paper
		radius="md"
		pos="relative"
		py={20}
		style={{
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			height: "100%",
		}}
	>
		<MapContainer
			zoom={13}
			center={point}
			style={{ width: "100%", height: "inherit", borderRadius: "inherit" }}
			scrollWheelZoom={false}
			attributionControl={false}
		>
			<TileLayer
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			<Marker icon={markerIcon} position={point} />
		</MapContainer>
	</Paper>;
};

export default GeographyMap;