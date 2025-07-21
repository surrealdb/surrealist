import { Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { Sidekick } from "~/components/Sidekick";

export function SidekickDrawer() {
	const [isOpen, openHandle] = useDisclosure();
	const handleClose = useStable(() => {
		openHandle.close();
	});

	const [width, setWidth] = useState(650);

	useIntent("open-sidekick", () => {
		openHandle.open();
	});

	return (
		<Drawer
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
			size={width}
			padding={0}
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
				style={{ zIndex: 1000 }}
			/>
			<Sidekick />
		</Drawer>
	);
}
