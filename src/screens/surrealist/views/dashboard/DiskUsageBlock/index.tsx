import {
	Alert,
	Badge,
	Box,
	Divider,
	Group,
	Paper,
	Progress,
	Skeleton,
	Stack,
	Text,
} from "@mantine/core";
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
				p="xl"
				gap={30}
				component={Stack}
				pos="relative"
				mih={168}
			>
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
