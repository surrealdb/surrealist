import { Text, Box, Stack, Paper, Group, ThemeIcon, Progress, Divider } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CloudInstance, CloudMeasurement } from "~/types";
import { formatMemory } from "~/util/helpers";
import { iconDatabase } from "~/util/icons";

export interface DiskUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	instance: CloudInstance | undefined;
	loading: boolean;
}

export function DiskUsageBlock({ usage, instance, loading }: DiskUsageBlockProps) {
	const storageUsage = 324;
	const storageMaxGB = instance?.storage_size ?? 0;
	const storageMax = storageMaxGB * 1024;

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 80 ? "red" : "blue";

	return (
		<Box>
			<Paper
				p="xl"
				gap={0}
				component={Stack}
				pos="relative"
			>
				<Stack gap="xl">
					<Group>
						<ThemeIcon
							color="slate"
							radius="xs"
							size="xl"
						>
							<Icon
								path={iconDatabase}
								size="xl"
								c="slate"
							/>
						</ThemeIcon>
						<Box>
							<PrimaryTitle mt={-4}>Storage usage</PrimaryTitle>
							<Text>Current disk utilization</Text>
						</Box>
					</Group>

					<Divider />

					<PrimaryTitle>{storageUsageMB}</PrimaryTitle>

					<Box>
						<Progress
							value={storageFrac}
							color={storageColor}
							size={6}
						/>

						<Text mt="md">
							You have used {storageFrac.toFixed(2)}% of your {storageMaxMB} limit
						</Text>
					</Box>
				</Stack>
			</Paper>
		</Box>
	);
}
