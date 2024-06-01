import { Suspense, lazy, useState } from "react";
import { iconClose, iconTarget } from "~/util/icons";
import { ActionIcon, Drawer, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { ModalTitle } from "~/components/ModalTitle";
import { DrawerResizer } from "~/components/DrawerResizer";
import { GeometryCollection, GeometryLine, GeometryMultiLine, GeometryMultiPoint, GeometryMultiPolygon, GeometryPoint, GeometryPolygon } from "surrealdb.js";
import { LoadingContainer } from "../LoadingContainer";

const GeographyMap = lazy(() => import("../GeographyMap"));

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

export interface InspectorDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
}

export const GeographyDrawer = ({ opened, data, onClose }: InspectorDrawerProps) => {
	const [width, setWidth] = useState(650);

	const geoJSON = toGeoJSONObject(data);

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

			<Suspense fallback={<LoadingContainer visible />}>
				<GeographyMap data={geoJSON} />
			</Suspense>
		</Drawer>
	);
};
