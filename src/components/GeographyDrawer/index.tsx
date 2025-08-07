import {
	ActionIcon,
	Box,
	Button,
	Drawer,
	Group,
	Stack,
	Tooltip,
} from "@mantine/core";
import { Suspense, lazy, useState } from "react";
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
import { useStable } from "~/hooks/stable";
import { GeographyDrawerEditor } from "./editor";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface GeographyDrawerProps {
	opened: boolean;
	data: GeographyInput;
	onClose: () => void;
}

export function GeographyDrawer({
	opened,
	data,
	onClose,
}: GeographyDrawerProps) {
	const [width, setWidth] = useState<number>(650);
	const [initialData, setInitialData] = useState<GeographyInput>(data);

	const save = useStable(() => {});
	const revert = useStable(() => {});
	const apply = useStable(() => {});

	const hasChanged = false;

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
			<DrawerResizer minSize={500} maxSize={1500} onResize={setWidth} />

			<Group mb="md" gap="sm">
				<PrimaryTitle
					style={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
					}}
				>
					<Icon left path={iconMarker} size="sm" />
					Geography explorer
				</PrimaryTitle>

				<Spacer />

				<Group align="center">
					<Tooltip label="Learn more about geometries">
						<Button
							variant="light"
							color="slate"
							size="xs"
							radius="xs"
							leftSection={<Icon path={iconBook} />}
							onClick={openGeometryLearnModal}
						>
							Learn more
						</Button>
					</Tooltip>
					<ActionIcon onClick={onClose} aria-label="Close geography drawer">
						<Icon path={iconClose} />
					</ActionIcon>
				</Group>
			</Group>
			<Stack flex={1} gap={6} style={{ flexShrink: 1, flexBasis: 0 }}>
				<Box flex={1} style={{ minHeight: 350 }}>
					<Suspense fallback={<LoadingContainer visible />}>
						<GeographyMap value={formatValue(initialData)} />
					</Suspense>
				</Box>
				<Box mt="xl" h="100%" flex={1} pos="relative">
					<GeographyDrawerEditor
						value={initialData}
						onChange={setInitialData}
					/>
				</Box>
				<Group>
					<Button disabled={!hasChanged} onClick={revert}>
						Revert changes
					</Button>
					<Spacer />
					<Button disabled={!hasChanged} onClick={apply}>
						Apply
					</Button>
					<Button disabled={!hasChanged} onClick={save}>
						Save
					</Button>
				</Group>
			</Stack>
		</Drawer>
	);
}
