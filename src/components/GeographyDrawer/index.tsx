import { useState } from "react";
import { iconClose, iconTarget } from "~/util/icons";
import { ActionIcon, Drawer, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { ModalTitle } from "~/components/ModalTitle";
import { DrawerResizer } from "~/components/DrawerResizer";
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { GeometryPoint } from "surrealdb.js";
import { LatLngTuple, Icon as LeafletIcon } from "leaflet";
import 'leaflet/dist/leaflet.css';
import markerIconPng from "leaflet/dist/images/marker-icon.png";

const markerIcon = new LeafletIcon({
	iconUrl: markerIconPng,
	iconSize: [25, 41],
	iconAnchor: [12, 41],
	popupAnchor: [1, -34],
	shadowSize: [41, 41],
});

export interface InspectorDrawerProps {
	opened: boolean;
	data: GeometryPoint;
	onClose: () => void;
}

export const GeographyDrawer = ({ opened, data, onClose }: InspectorDrawerProps) => {
	const [long, lat] = data.point;
	const point = [lat.toNumber(), long.toNumber()] as LatLngTuple;

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			size={width}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column"
				}
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={900}
				onResize={setWidth}
			/>

			<Group mb="md" gap="sm">
				<ModalTitle>
					<Icon left path={iconTarget} size="sm" /> {/* TODO : icon map */}
					Geography Explorer
				</ModalTitle>

				<Spacer />

				<Group align="center">
					<ActionIcon
						onClick={onClose}
						aria-label="Close geography drawer"
					>
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			</Group>

			<section style={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				height: "100%",
			}}>
				<MapContainer
					zoom={13}
					center={point}
					style={{ width: "100%", height: "inherit" }}
					scrollWheelZoom={false}
					attributionControl={false}
				>
					<TileLayer
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					<Marker icon={markerIcon} position={point} />
				</MapContainer>
			</section>
		</Drawer>
	);
};
