import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import { LatLng, geoJSON, latLng } from "leaflet";
import 'leaflet/dist/leaflet.css';
import { Paper } from '@mantine/core';

const convertCoordsToLatLng = (point: [number, number] | [number, number, number]): LatLng => {
	return latLng({ lat: point[1], lng: point[0] });
};

export type GeographyMapProps = {
	data: any;
};

export const GeographyMap = ({ data }: GeographyMapProps) => {
	const leafletGeoJson = geoJSON(data, {
		coordsToLatLng: convertCoordsToLatLng
	});
	const leafletCenter = leafletGeoJson.getBounds().getCenter();
	const zoom = data.type === "Point" ? 14 : 10;

	return (
		<Paper
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
				zoom={zoom}
				center={leafletCenter}
				style={{ width: "100%", height: "inherit", borderRadius: "inherit" }}
				scrollWheelZoom={false}
				attributionControl={false}
			>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
				/>
				<GeoJSON data={leafletGeoJson.toGeoJSON()} />
			</MapContainer>
		</Paper>
	);
};

export default GeographyMap;