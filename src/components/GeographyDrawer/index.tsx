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
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconClose, iconMarker } from "~/util/icons";
import { formatValue } from "~/util/surrealql";
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
	const [geoJSON, setGeoJSON] = useInputState(formatValue(data));

	useEffect(() => {
		setGeoJSON(formatValue(data));
	}, [data]);

	const extensions = useMemo(() => [surrealql()], []);

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
					<CodeEditor
						pos="absolute"
						inset={0}
						autoFocus
						value={geoJSON}
						onChange={setGeoJSON}
						extensions={extensions}
					/>
				</Box>
			</Stack>
		</Drawer>
	);
}
