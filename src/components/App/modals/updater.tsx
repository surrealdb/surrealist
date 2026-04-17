import { ActionIcon, Box, Dialog, Group, Text, ThemeIcon } from "@mantine/core";
import { Icon, iconClose, iconDownload } from "@surrealdb/ui";
import type { MouseEvent } from "react";
import { useStable } from "~/hooks/stable";
import { useDesktopUpdater } from "~/hooks/updater";
import { useInterfaceStore } from "~/stores/interface";
import classes from "../style.module.scss";

export function UpdaterDialog() {
	const { hideAvailableUpdate } = useInterfaceStore.getState();
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);

	const { phase, progress, version, startUpdate } = useDesktopUpdater();

	const hideUpdate = useStable((e: MouseEvent) => {
		e.stopPropagation();
		hideAvailableUpdate();
	});

	// TODO Use notification

	return (
		<Dialog
			opened={showUpdate}
			onClose={hideAvailableUpdate}
			size="lg"
			shadow="sm"
			onClick={startUpdate}
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
				<ThemeIcon
					variant="gradient"
					size={38}
				>
					<Icon
						path={iconDownload}
						size="lg"
					/>
				</ThemeIcon>
				<Box miw={200}>
					<Text
						c="white"
						fw={500}
						fz="lg"
					>
						New version available
					</Text>
					{phase === "downloading" ? (
						<Text>Installing... ({progress}%)</Text>
					) : phase === "error" ? (
						<Text c="red">Failed to install update</Text>
					) : (
						<Text>Click to install version {version}</Text>
					)}
				</Box>
			</Group>
		</Dialog>
	);
}
