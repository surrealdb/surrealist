import { Text, Box, Stack, Paper, Progress, Divider, Group, Skeleton } from "@mantine/core";
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
					gap="xl"
				>
					<Box>
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

						<Text mt="sm">
							You have used {storageFrac.toFixed(2)}% of your storage limit
						</Text>
					</Box>
				</Stack>
			</Paper>
		</Skeleton>
	);
}
