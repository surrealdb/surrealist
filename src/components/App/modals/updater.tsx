import { ActionIcon, Alert, Box, Dialog, Group, Text } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { type MouseEvent, useState } from "react";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { iconClose, iconDownload } from "~/util/icons";
import classes from "../style.module.scss";

type Phase = "idle" | "downloading" | "error";

function extractMajor(version: string) {
	return Number.parseInt(version.split(".")[0] ?? 0);
}

export function UpdaterDialog() {
	const { hideAvailableUpdate } = useInterfaceStore.getState();

	const update = useInterfaceStore((s) => s.availableUpdate);
	const showUpdate = useInterfaceStore((s) => s.showAvailableUpdate);
	const [phase, setPhase] = useState<Phase>("idle");
	const [packageTotal, setPackageTotal] = useState(0);
	const [packageProgress, setPackageProgress] = useState(0);

	const currentMajor = extractMajor(import.meta.env.VERSION);
	const latestMajor = extractMajor(update?.version || "0.0.0");
	const isDangerous = latestMajor > currentMajor;

	const hideUpdate = useStable((e: MouseEvent) => {
		e.stopPropagation();
		hideAvailableUpdate();
	});

	const installUpdate = useStable(async () => {
		if (!update || phase !== "idle") return;

		if (isDangerous) {
			const config = useConfigStore.getState();

			await invoke("backup_config", {
				config: JSON.stringify(config),
				version: config.configVersion,
			});
		}

		setPhase("downloading");
		setPackageProgress(0);

		try {
			await update.downloadAndInstall((e) => {
				if (e.event === "Started") {
					setPackageTotal(e.data.contentLength || 0);
				} else if (e.event === "Progress") {
					setPackageProgress((p) => p + e.data.chunkLength);
				}
			});

			await relaunch();
		} catch (err: any) {
			console.error(err);
			setPhase("error");
		}
	});

	const promptUpdate = useConfirmation({
		title: "New major version",
		message: (
			<>
				The update you are about to install is a new major version of
				Surrealist. Are you sure you want to proceed?
				<Alert mt="xl" color="orange" title="Warning">
					An upgrade could result in incompatibility with older
					versions of SurrealDB.
				</Alert>
			</>
		),
		confirmText: (
			<Group gap="xs">
				Install update
				<Icon path={iconDownload} />
			</Group>
		),
		confirmProps: { variant: "gradient" },
		dismissText: "Don't update now",
		onConfirm: () => installUpdate(),
		onDismiss: () => hideAvailableUpdate(),
	});

	const handleClick = useStable(() => {
		if (isDangerous) {
			promptUpdate();
		} else {
			installUpdate();
		}
	});

	const progress =
		packageTotal > 0
			? ((packageProgress / packageTotal) * 100).toFixed(0)
			: 0;

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
			onClick={handleClick}
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
						<Text c="gray.5">Installing... ({progress}%)</Text>
					) : phase === "error" ? (
						<Text c="red">Failed to install update</Text>
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
