import { Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon } from "@surrealdb/ui";
import { useRef, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { DrawerResizer } from "~/components/DrawerResizer";
import { Sidekick, SidekickHandle } from "~/components/Sidekick";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { iconClose } from "~/util/icons";

export function SidekickDrawer() {
	const sidekickRef = useRef<SidekickHandle>(null);
	const [isOpen, openHandle] = useDisclosure();
	const [width, setWidth] = useState(650);
	const handleClose = useStable(() => {
		openHandle.close();
	});

	useIntent("open-sidekick", ({ search }) => {
		openHandle.open();

		if (search) {
			setTimeout(() => {
				sidekickRef.current?.sendMessage(search);
			}, 100);
		}
	});

	useIntent("close-sidekick", () => {
		openHandle.close();
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
			<Sidekick
				ref={sidekickRef}
				rightSection={
					<ActionButton
						label="Hide Sidekick"
						icon={iconClose}
						onClick={handleClose}
						size="lg"
					>
						<Icon path={iconClose} />
					</ActionButton>
				}
			/>
		</Drawer>
	);
}
