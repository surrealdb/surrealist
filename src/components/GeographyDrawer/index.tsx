import { ActionIcon, Box, Drawer, Group, Stack } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { surrealql } from "@surrealdb/codemirror";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { LoadingContainer } from "~/components/LoadingContainer";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconClose, iconMarker } from "~/util/icons";
import { CodeEditor } from "../CodeEditor";
import type { GeographyInput } from "../GeographyMap";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface GeographyDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
}

export function GeographyDrawer({ opened, data, onClose }: GeographyDrawerProps) {
	const [width, setWidth] = useState(650);
	const [geoJSON, setGeoJSON] = useInputState(getSurrealQL().formatValue(data));

	useEffect(() => {
		setGeoJSON(getSurrealQL().formatValue(data));
	}, [data]);

	const extensions = useMemo(() => [surrealql()], []);

	// parses geoJSON and splits langitude and latitude and creates a fitting string with bail out if it doesn't fit
	const coordLabel = useMemo(() => {
		try {
			const parsed = getSurrealQL().parseValue<any>(geoJSON).toJSON();

			const pickCoords = (obj: any): [number, number] | null => {
				if (!obj) return null;
				if (obj.type === "Point" && Array.isArray(obj.coordinates)) {
					return obj.coordinates as [number, number];
				}
				if (obj.type === "Feature" && obj.geometry?.type === "Point") {
					return obj.geometry.coordinates as [number, number];
				}
				if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
					const f = obj.features.find((x: any) => x?.geometry?.type === "Point");
					if (f?.geometry?.coordinates) return f.geometry.coordinates as [number, number];
				}
				return null;
			};

			const coords = pickCoords(parsed);
			if (!coords) return null;

			const [lng, lat] = coords;
			const fmt = (v: unknown, p = 4) => {
				const n = typeof v === "number" ? v : Number(v);
				return Number.isFinite(n) ? n.toFixed(p) : String(v);
			};
			return `Longitude: ${fmt(lng)}, Latitude: ${fmt(lat)}`;
		} catch {
			return null;
		}
	}, [geoJSON]);

	return (
		<Drawer
			opened={opened}
			onClose={onClose}
			position="right"
			trapFocus={false}
			onClick={ON_STOP_PROPAGATION}
			size={width}
			styles={{
				body: {
					height: "100%",
					display: "flex",
					flexDirection: "column",
				},
			}}
		>
			<DrawerResizer
				minSize={500}
				maxSize={1500}
				onResize={setWidth}
			/>

			<Group
				mb="md"
				gap="sm"
			>
				<PrimaryTitle
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Icon
						left
						path={iconMarker}
						size="sm"
					/>
					Geography explorer
				</PrimaryTitle>

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

			<Stack
				flex={1}
				gap={6}
				style={{ flexShrink: 1, flexBasis: 0 }}
			>
				<Box flex={1}>
					<Suspense fallback={<LoadingContainer visible />}>
						<GeographyMap value={geoJSON} />
					</Suspense>
				</Box>

				<Label style={{ marginTop: "20px" }}>Contents</Label>

				<Box
					flex={1}
					pos="relative"
				>
					{coordLabel ? (
						<Box c="cyan.4">{coordLabel}</Box>
					) : (
						<CodeEditor
							pos="absolute"
							inset={0}
							autoFocus
							value={geoJSON}
							onChange={setGeoJSON}
							extensions={extensions}
						/>
					)}
				</Box>
			</Stack>
		</Drawer>
	);
}
