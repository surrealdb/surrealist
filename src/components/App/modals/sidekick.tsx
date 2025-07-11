import { Drawer } from "@mantine/core";

import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { DrawerResizer } from "~/components/DrawerResizer";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";

export function SidekickDrawer() {
	const [isOpen, openHandle] = useDisclosure();

	const handleClose = useStable(() => {
		openHandle.close();
	});

	useIntent("open-sidekick", () => {
		openHandle.open();
	});

	const [width, setWidth] = useState(650);

	return (
		<Drawer
			opened={isOpen}
			onClose={handleClose}
			position="right"
			trapFocus={false}
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
			Test Sidekick Drawer
		</Drawer>
	);
}
