import { Suspense, lazy, useState } from "react";
import { iconClose, iconTarget } from "~/util/icons";
import { ActionIcon, Drawer, Group } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { ModalTitle } from "~/components/ModalTitle";
import { DrawerResizer } from "~/components/DrawerResizer";
import { GeometryPoint } from "surrealdb.js";
import { LoadingContainer } from "../LoadingContainer";

const GeographyMap = lazy(() => import("../GeographyMap"));

export interface InspectorDrawerProps {
	opened: boolean;
	data: GeometryPoint;
	onClose: () => void;
}

export const GeographyDrawer = ({ opened, data, onClose }: InspectorDrawerProps) => {
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

			<Suspense
				fallback={<LoadingContainer visible />}
			>
				<GeographyMap data={data} />
			</Suspense>
		</Drawer>
	);
};
