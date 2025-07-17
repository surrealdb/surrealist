import { ActionIcon, Box, Button, Drawer, Group, NumberInput, Stack, Tooltip } from "@mantine/core";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Icon } from "~/components/Icon";
import { LoadingContainer } from "~/components/LoadingContainer";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { iconBook, iconClose, iconMarker } from "~/util/icons";
import { formatValue } from "~/util/surrealql";
import type { GeographyInput } from "../GeographyMap";
import { openGeometryLearnModal } from "~/modals/geometry-learn";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface GeographyDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
}

export function GeographyDrawer({ opened, data, onClose }: GeographyDrawerProps) {
	const [width, setWidth] = useState<number>(650);

	const [longitude, setLongitude] = useState<number>(0);
	const [latitude, setLatitude] = useState<number>(0);

	useEffect(() => {
		const geo = formatValue(data);
		const match = geo.match(/\((-?\d+\.\d+), (-?\d+\.\d+)\)/);

		if (match) {
			setLongitude(Number(match[1]));
			setLatitude(Number(match[2]));
		}
	}, [data]);

	const geoJSON = useMemo<string>(() => {
		return `(${longitude}, ${latitude})`;
	}, [longitude, latitude]);

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
					<Tooltip label="Learn more about geometries">
						<Button
							variant="light"
							size="xs"
							leftSection={<Icon path={iconBook} />}
							onClick={openGeometryLearnModal}
						>
							Learn more
						</Button>
					</Tooltip>
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

				<Box
					mt="xl"
					flex={1}
					pos="relative"
				>
					<Group grow>
						<NumberInput
							label="Longitude"
							value={longitude}
							onChange={(value) => setLongitude(Number(value))}
						/>
						<NumberInput
							label="Latitude"
							value={latitude}
							onChange={(value) => setLatitude(Number(value))}
						/>
					</Group>
				</Box>
			</Stack>
		</Drawer>
	);
}
