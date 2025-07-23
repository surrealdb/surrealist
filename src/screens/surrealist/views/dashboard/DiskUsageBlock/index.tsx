import { Alert, Box, Button, Group, Paper, Progress, Skeleton, Stack, Text } from "@mantine/core";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudMeasurement } from "~/types";
import { tagEvent } from "~/util/analytics";
import { measureStorageUsage } from "~/util/cloud";
import { formatMemory } from "~/util/helpers";

export interface DiskUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
	onUpgrade: () => void;
}

export function DiskUsageBlock({ usage, instance, isLoading, onUpgrade }: DiskUsageBlockProps) {
	const storageUsage = measureStorageUsage(usage ?? []);
	const storageMaxGB = instance?.storage_size ?? 0;
	const storageMax = storageMaxGB * 1024;

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 80 ? "red" : "surreal";
	const canManage = useHasOrganizationRole(instance?.organization_id ?? "", "admin");

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
				gap={30}
				component={Stack}
				variant="gradient"
				pos="relative"
				mih={168}
			>
				<Group>
					<Stack gap={0}>
						<Text
							c="bright"
							fw={700}
							fz="xl"
						>
							Storage usage
						</Text>
						<Text>{storageFrac.toFixed(2)}% used</Text>
					</Stack>
					{canManage && (
						<>
							<Spacer />
							<Button
								c="surreal"
								size="xs"
								fz={13}
								variant="subtle"
								onClick={handleUpgrade}
							>
								Upgrade
							</Button>
						</>
					)}
				</Group>

				{instance?.distributed_storage_specs ? (
					<Alert
						flex={1}
						color="violet"
						title="Coming soon"
					>
						Storage usage for distributed instances is not yet available and will be
						added in a future release.
					</Alert>
				) : (
					<Box>
						<Group>
							<Text
								c="bright"
								fz="lg"
								fw={600}
							>
								{storageUsageMB}
							</Text>
							<Spacer />
							<Text fz="lg">{storageMaxMB}</Text>
						</Group>
						<Progress
							value={storageFrac}
							color={storageColor}
							size={4}
							mt="md"
						/>
					</Box>
				)}
			</Paper>
		</Skeleton>
	);
}
