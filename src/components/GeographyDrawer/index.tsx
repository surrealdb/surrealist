import type { GeographyInput } from "../GeographyMap";
import { Suspense, lazy, useState } from "react";
import { iconClose, iconMarker } from "~/util/icons";
import { ActionIcon, Box, Drawer, Group, Stack } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { ModalTitle } from "~/components/ModalTitle";
import { DrawerResizer } from "~/components/DrawerResizer";
import { LoadingContainer } from "~/components/LoadingContainer";
import { formatValue } from "~/util/surrealql";
import { surrealql } from "codemirror-surrealql";
import { Label } from "~/components/Label";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { useInputState } from "@mantine/hooks";
import { CodeEditor } from "../CodeEditor";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface GeographyDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
}

export const GeographyDrawer = ({ opened, data, onClose }: GeographyDrawerProps) => {
	const [width, setWidth] = useState(650);

	const [geoJSON, setGeoJSON] = useInputState(formatValue(data));

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
				<ModalTitle style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
					<Icon left path={iconMarker} size="sm" />
					Geography explorer
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

			<Stack flex={1} gap={6} style={{ flexShrink: 1, flexBasis: 0 }}>
				<Box flex={1}>
					<Suspense fallback={<LoadingContainer visible />}>
						<GeographyMap value={geoJSON} />
					</Suspense>
				</Box>

				<Label style={{ marginTop: "20px" }}>Contents</Label>

				<Box flex={1} pos="relative">
					<CodeEditor
						pos="absolute"
						inset={0}
						autoFocus
						value={geoJSON}
						onChange={setGeoJSON}
						extensions={[
							surrealql(),
						]}
					/>
				</Box>
			</Stack>
		</Drawer>
	);
};
