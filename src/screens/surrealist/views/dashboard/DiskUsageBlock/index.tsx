import { Divider, Group, Paper, Progress, Skeleton, Stack, Text } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { CloudInstance, CloudMeasurement } from "~/types";
import { measureStorageUsage } from "~/util/cloud";
import { formatMemory } from "~/util/helpers";
import { iconDatabase } from "~/util/icons";

export interface DiskUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function DiskUsageBlock({ usage, instance, isLoading }: DiskUsageBlockProps) {
	const storageUsage = measureStorageUsage(usage ?? []);
	const storageMaxGB = instance?.storage_size ?? 0;
	const storageMax = storageMaxGB * 1024;

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 80 ? "red" : "surreal";

	return (
		<Skeleton visible={isLoading}>
			<Paper
				gap={0}
				component={Stack}
				pos="relative"
				mih={202}
			>
				<Group p="xl">
					<Icon
						path={iconDatabase}
						size="lg"
					/>
					<Text
						c="bright"
						fw={700}
						fz="xl"
					>
						Storage usage
					</Text>
				</Group>
				<Divider />
				<Stack
					p="xl"
					gap={0}
					flex={1}
				>
					<Group>
						<Text
							c="bright"
							fz="xl"
							fw={600}
						>
							{storageUsageMB}
						</Text>
						<Spacer />
						<Text
							fz="xl"
							fw={600}
						>
							{storageMaxMB}
						</Text>
					</Group>

					<Progress
						value={storageFrac}
						color={storageColor}
						size={6}
						mt="md"
					/>

					<Spacer />

					<Text ta="center">
						You have used {storageFrac.toFixed(2)}% of your storage limit
					</Text>
				</Stack>
			</Paper>
		</Skeleton>
	);
}
