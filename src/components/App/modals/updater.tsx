import { ActionIcon, Box, Dialog, Group, Text } from "@mantine/core";
import type { MouseEvent } from "react";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdater } from "~/hooks/updater";
import { useInterfaceStore } from "~/stores/interface";
import { iconClose, iconDownload } from "~/util/icons";
import classes from "../style.module.scss";

export function UpdaterDialog() {
	const { hideAvailableUpdate } = useInterfaceStore.getState();
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);

	const { phase, progress, version, startUpdate } = useDesktopUpdater();

	const hideUpdate = useStable((e: MouseEvent) => {
		e.stopPropagation();
		hideAvailableUpdate();
	});

	return (
		<Dialog
			opened={showUpdate}
			onClose={hideAvailableUpdate}
			size="lg"
			shadow="sm"
			position={{
				bottom: "var(--mantine-spacing-xl)",
				left: "var(--mantine-spacing-xl)",
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200,
			}}
			classNames={{
				root: classes.updateDialog,
			}}
			onClick={startUpdate}
		>
			<ActionIcon
				onClick={hideUpdate}
				pos="absolute"
				variant="subtle"
				top={8}
				right={8}
			>
				<Icon path={iconClose} />
			</ActionIcon>
			<Group>
				<Box className={classes.updateDialogIcon}>
					<Icon
						path={iconDownload}
						size="lg"
						c="white"
					/>
				</Box>
				<Box miw={200}>
					<Text
						c="white"
						fw={500}
						fz="lg"
					>
						New version available
					</Text>
					{phase === "downloading" ? (
						<Text c="gray.5">Installing... ({progress}%)</Text>
					) : phase === "error" ? (
						<Text c="red">Failed to install update</Text>
					) : (
						<Text c="gray.5">Click to install version {version}</Text>
					)}
				</Box>
			</Group>
		</Dialog>
	);
}
