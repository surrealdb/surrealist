import { Button, Center, Group, Modal, Stack, Text } from "@mantine/core";
import { ModalTitle } from "~/components/ModalTitle";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { migrateLegacyConfig } from "~/util/migrator";
import { useConfigStore } from "~/stores/config";
import { Icon } from "~/components/Icon";
import { iconCheck, iconReset } from "~/util/icons";

export function LegacyModal() {
	const [isOpen, openHandle] = useDisclosure();

	const checkLegacyConfig = async () => {
		const hasLegacy = await adapter.hasLegacyConfig();

		if (hasLegacy) {
			openHandle.open();
		}
	};

	const skipMigration = useStable(async () => {
		adapter.handleLegacyCleanup();
		openHandle.close();
	});

	const runMigration = useStable(async () => {
		const legacy = await adapter.getLegacyConfig();
		const migrated = migrateLegacyConfig(legacy);

		useConfigStore.setState(migrated);

		adapter.handleLegacyCleanup();
		openHandle.close();
	});

	useEffect(() => {
		checkLegacyConfig();
	}, []);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			closeOnClickOutside={false}
			closeOnEscape={false}
		>
			<Center>
				<Icon path={iconReset} size={2.5} c="bright" mb="sm" />
			</Center>

			<ModalTitle ta="center" mb="xl">
				Config update required
			</ModalTitle>

			<Stack>
				<Text>
					Your configuration file is outdated and needs to be migrated to a new format. Click the button below to start the migration process, or press skip to reset the configuration to default values.
				</Text>

				<Text>
					The original configuration will be backed up and can be restored at any time.
				</Text>

				<Group>
					<Button
						color="slate"
						variant="light"
						onClick={skipMigration}
					>
						Skip
					</Button>
					<Spacer />
					<Button
						variant="gradient"
						onClick={runMigration}
						rightSection={<Icon path={iconCheck} />}
					>
						Migrate now
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
