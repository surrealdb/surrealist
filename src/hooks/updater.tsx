import { Alert, Group } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { iconDownload } from "~/util/icons";
import { useStable } from "./stable";

type Phase = "idle" | "downloading" | "error";

function extractMajor(version: string) {
	return Number.parseInt(version.split(".")[0] ?? 0);
}

/**
 * Provides the updater dialog logic for the desktop app.
 */
export function useDesktopUpdater() {
	const { hideAvailableUpdate } = useInterfaceStore.getState();

	const update = useInterfaceStore((s) => s.availableUpdate);

	const [phase, setPhase] = useState<Phase>("idle");
	const [packageTotal, setPackageTotal] = useState(0);
	const [packageProgress, setPackageProgress] = useState(0);

	const currentMajor = extractMajor(import.meta.env.VERSION);
	const latestMajor = extractMajor(update?.version || "0.0.0");
	const isDangerous = latestMajor > currentMajor;

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
			console.error("Failed to update desktop app", err);
			setPhase("error");
		}
	});

	const promptUpdate = useConfirmation({
		title: "New major version",
		message: (
			<>
				The update you are about to install is a new major version of Surrealist. Are you
				sure you want to proceed?
				<Alert
					mt="xl"
					color="orange"
					title="Warning"
				>
					An upgrade could result in incompatibility with older versions of SurrealDB.
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

	const startUpdate = useStable(() => {
		if (isDangerous) {
			promptUpdate();
		} else {
			installUpdate();
		}
	});

	const progress = packageTotal > 0 ? ((packageProgress / packageTotal) * 100).toFixed(0) : "0";
	const version = update?.version || "";

	return {
		phase,
		progress,
		version,
		startUpdate,
	} as const;
}
