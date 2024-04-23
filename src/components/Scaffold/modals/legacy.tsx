import logoUrl from "~/assets/images/logo.png";
import { Anchor, Button, Group, Image, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { migrateLegacyConfig } from "~/util/migrator";
import { useConfigStore } from "~/stores/config";
import { Icon } from "~/components/Icon";
import { iconChevronRight } from "~/util/icons";
import { SurrealistLogo } from "~/components/SurrealistLogo";
import { promptChangelog } from "~/util/changelogs";

export function LegacyModal() {
	const [isOpen, openHandle] = useDisclosure();

	const checkLegacyConfig = async () => {
		const hasLegacy = await adapter.hasLegacyConfig();

		if (hasLegacy) {
			const legacy = await adapter.getLegacyConfig();
			const migrated = migrateLegacyConfig(legacy);

			useConfigStore.setState(migrated);

			adapter.handleLegacyCleanup();
			openHandle.open();

			promptChangelog();
		}
	};

	useEffect(() => {
		checkLegacyConfig();
	}, []);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			trapFocus={false}
			size="sm"
		>
			<Group mb="xl" gap="md" wrap="nowrap">
				<Image
					src={logoUrl}
					w={42}
				/>
				<Stack gap={6} align="start">
					<SurrealistLogo c="bright" h={20} />
				</Stack>
			</Group>

			<Stack>
				<Text c="bright">
					Welcome back to Surrealist!
				</Text>

				<Text c="bright">
					Your configuration has been automatically migrated to the new format so you can continue where you left off.
				</Text>

				<Text>
					Want to learn more about the new Surrealist? Feel free to visit
					the <Anchor href="https://github.com/surrealdb/Surrealist/releases/tag/v2.0.0">changelog</Anchor> or
					read our updated <Anchor href="https://surrealdb.com/docs/surrealist">documentation</Anchor>.
				</Text>
			</Stack>

			<Button
				mt="xl"
				size="xs"
				fullWidth
				variant="gradient"
				onClick={openHandle.close}
				rightSection={<Icon path={iconChevronRight} />}
			>
				Get started
			</Button>
		</Modal>
	);
}
