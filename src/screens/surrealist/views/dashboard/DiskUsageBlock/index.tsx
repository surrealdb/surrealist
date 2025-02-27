import { Text, Box, Stack, Paper, Progress, Divider, Group, ThemeIcon } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { CloudInstance, CloudMeasurement } from "~/types";
import { formatMemory } from "~/util/helpers";
import { iconDatabase } from "~/util/icons";

export interface DiskUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	instance: CloudInstance | undefined;
	loading: boolean;
}

export function DiskUsageBlock({ usage, instance, loading }: DiskUsageBlockProps) {
	const storageUsage = 325;
	const storageMaxGB = instance?.storage_size ?? 0;
	const storageMax = storageMaxGB * 1024;

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 80 ? "red" : "surreal";

	return (
		<Box>
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
		</Box>
	);
}
