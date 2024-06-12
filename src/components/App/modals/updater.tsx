import classes from "../style.module.scss";
import { relaunch } from "@tauri-apps/plugin-process";
import { ActionIcon, Box, Dialog, Group, Text } from "@mantine/core";
import { MouseEvent, useState } from "react";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useInterfaceStore } from "~/stores/interface";
import { iconClose, iconDownload } from "~/util/icons";

type Phase = 'idle' | 'downloading' | 'error';

export function UpdaterDialog() {
	const { hideAvailableUpdate } = useInterfaceStore.getState();

	const update = useInterfaceStore((s) => s.availableUpdate);
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);
	const [phase, setPhase] = useState<Phase>('idle');
	const [packageTotal, setPackageTotal] = useState(0);
	const [packageProgress, setPackageProgress] = useState(0);

	const hideUpdate = useStable((e: MouseEvent) => {
		e.stopPropagation();
		hideAvailableUpdate();
	});

	const installUpdate = useStable(async () => {
		if (!update || phase !== 'idle') return;

		setPhase('downloading');
		setPackageProgress(0);

		try {
			await update.downloadAndInstall(e => {
				if (e.event === "Started") {
					setPackageTotal(e.data.contentLength || 0);
				} else if (e.event === "Progress") {
					setPackageProgress(p => p + e.data.chunkLength);
				}
			});

			await relaunch();
		} catch(err: any) {
			console.error(err);
			setPhase('error');
		}
	});

	const progress = packageTotal > 0
		? (packageProgress / packageTotal * 100).toFixed(0)
		: 0;

	return (
		<Dialog
			opened={showUpdate}
			onClose={hideAvailableUpdate}
			size="lg"
			shadow="sm"
			position={{
				bottom: "var(--mantine-spacing-xl)",
				left: "var(--mantine-spacing-xl)"
			}}
			transitionProps={{
				transition: "slide-up",
				timingFunction: "ease",
				duration: 200
			}}
			classNames={{
				root: classes.updateDialog
			}}
			onClick={installUpdate}
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
					<Icon path={iconDownload} size="lg" c="white" />
				</Box>
				<Box miw={200}>
					<Text c="white" fw={500} fz="lg">
						New version available
					</Text>
					{phase === "downloading" ? (
						<Text c="gray.5">
							Installing... ({progress}%)
						</Text>
					) : phase === "error" ? (
						<Text c="red">
							Failed to install update
						</Text>
					) : (
						<Text c="gray.5">
							Click to install version {update?.version}
						</Text>
					)}
				</Box>
			</Group>
		</Dialog>
	);
}