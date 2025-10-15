import { ActionIcon, Box, Dialog, Group, Text, ThemeIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { iconClose, iconWarning } from "~/util/icons";
import classes from "../style.module.scss";

export function FailedConnectDialog() {
	const { setFailedConnected } = useCloudStore.getState();

	const isOpen = useCloudStore((s) => s.failedConnect);
	const onClose = useStable(() => {
		setFailedConnected(false);
	});

	return (
		<Dialog
			opened={isOpen}
			onClose={onClose}
			size={600}
			shadow="sm"
			radius="md"
			position={{
				left: "calc(50% - 263px)",
				right: "calc(50% + 300px)",
				bottom: 32,
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200,
			}}
			classNames={{
				root: classes.updateDialog,
			}}
		>
			<Group>
				<ThemeIcon
					radius="sm"
					color="orange"
					variant="light"
					size={38}
				>
					<Icon path={iconWarning} />
				</ThemeIcon>
				<Box flex="1">
					<Text
						fw={600}
						c="bright"
					>
						Failed to connect to SurrealDB Cloud
					</Text>
					<Text mt={4}>
						<Text c="gray.5">
							Some functionality may be unavailable. Check your internet connection
						</Text>
					</Text>
				</Box>
				<ActionIcon
					size="lg"
					onClick={onClose}
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
		</Dialog>
	);
}
