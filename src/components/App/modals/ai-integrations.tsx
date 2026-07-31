import { Drawer } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icon, iconClose } from "@surrealdb/ui";
import { useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { AiIntegrations } from "~/components/AiIntegrations";
import { DrawerResizer } from "~/components/DrawerResizer";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";

export function AiIntegrationsDrawer() {
	const [isOpen, openHandle] = useDisclosure();
	const [width, setWidth] = useState(650);
	const handleClose = useStable(() => {
		openHandle.close();
	});

	useIntent("open-ai-integrations", () => {
		openHandle.open();
	});

	useIntent("close-ai-integrations", () => {
		openHandle.close();
	});

	return (
		<Drawer
			withCloseButton={false}
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
			<AiIntegrations
				rightSection={
					<ActionButton
						label="Close"
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
