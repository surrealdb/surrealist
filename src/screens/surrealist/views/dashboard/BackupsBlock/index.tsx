import { Box, Button, Center, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { formatDistance } from "date-fns";
import { hasOrganizationRole } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { CloudBackup, CloudInstance, CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { iconChevronRight, iconKeyboardShift } from "~/util/icons";

export interface BackupsBlockProps {
	instance: CloudInstance | undefined;
	organisation: CloudOrganization;
	backups: CloudBackup[] | undefined;
	isLoading: boolean;
	onUpgrade: () => void;
}

export function BackupsBlock({
	instance,
	organisation,
	backups,
	isLoading,
	onUpgrade,
}: BackupsBlockProps) {
	const latest = backups?.[0];
	const canUpgrade = hasOrganizationRole(organisation, "admin");
	const unavailable = instance?.type.category === "free";

	const handleUpgrade = useStable(() => {
		onUpgrade();

		if (instance) {
			tagEvent("cloud_instance_upgrade_click", {
				instance: instance.id,
				region: instance.region,
				version: instance.version,
				instance_type: instance.type.slug,
				storage_size: instance.storage_size,
				organisation: instance.organization_id,
			});
		}
	});

	return (
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={15}
				component={Stack}
				variant="gradient"
				pos="relative"
				mih={168}
			>
				<Text
					c="bright"
					fw={700}
					fz="xl"
				>
					Backups
				</Text>
				{unavailable ? (
					<>
						<Text flex={1}>
							Automated backups are not available for free instances. Upgrade this
							instance to enable automatic backups.
						</Text>
						{canUpgrade && (
							<Button
								size="xs"
								rightSection={<Icon path={iconKeyboardShift} />}
								variant="gradient"
								onClick={handleUpgrade}
							>
								Upgrade now
							</Button>
						)}
					</>
				) : latest ? (
					<>
						<Box flex={1}>
							<Text>Latest backup</Text>
							<Text
								c="bright"
								fz="lg"
								fw={600}
							>
								{formatDistance(latest.snapshot_started_at, new Date(), {
									addSuffix: true,
								})}
							</Text>
						</Box>
						<Tooltip label="This functionality will be available soon">
							<Button
								size="xs"
								rightSection={<Icon path={iconChevronRight} />}
								variant="gradient"
								disabled
							>
								View available backups
							</Button>
						</Tooltip>
					</>
				) : (
					<Center flex={1}>
						<Text c="slate">Waiting for next backup...</Text>
					</Center>
				)}
			</Paper>
		</Skeleton>
	);
}
