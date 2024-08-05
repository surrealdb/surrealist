import { Alert, Box, Button, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { invoke } from "@tauri-apps/api/core";
import { adapter } from "~/adapter";
import { DesktopAdapter } from "~/adapter/desktop";
import { ModalTitle } from "~/components/ModalTitle";
import { CONFIG_VERSION } from "./defaults";
import { relaunch } from "@tauri-apps/plugin-process";

async function hasConfigBackup() {
	if (!(adapter instanceof DesktopAdapter)) {
		return false;
	}

	return invoke<boolean>("has_config_backup", {
		version: CONFIG_VERSION
	});
}

async function restoreBackup() {
	await invoke("restore_config_backup", {
		version: CONFIG_VERSION
	});

	await relaunch();
}

export async function showDowngradeWarningModal() {
	const hasBackup = await hasConfigBackup();

	openModal({
		closeOnClickOutside: false,
		closeOnEscape: false,
		title: (
			<ModalTitle>Incompatible configuration</ModalTitle>
		),
		children: (
			<Box>
				<Text>
					Your config file was updated by a newer version of Surrealist and is incompatible with this version.
				</Text>
				{hasBackup ? (
					<Alert
						mt="xl"
						color="blue"
					>
						<Text>
							A backup of your previous configuration file was found. You can restore it by clicking the button below.
							Note that this will discard any changes you made since the last update.
						</Text>
						<Button
							style={{ outline: "none" }}
							onClick={restoreBackup}
							color="blue"
							mt="md"
						>
							Restore backup
						</Button>
					</Alert>
				) : (
					<Text c="red" mt="xl">
						Please reset your configuration file or update your version of Surrealist to continue.
					</Text>
				)}
			</Box>
		)
	});
}