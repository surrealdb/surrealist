import { DonutChart } from "@mantine/charts";
import {
	Paper,
	Group,
	Divider,
	Text,
	Box,
	Progress,
	ThemeIcon,
	Stack,
	Center,
} from "@mantine/core";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { CloudInstance, CloudMeasurement } from "~/types";
import { measureStorageUsage, computeStorageSize } from "~/util/cloud";
import { formatMemory } from "~/util/helpers";
import { iconDatabase } from "~/util/icons";

export interface DiskUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	instance: CloudInstance | undefined;
	loading: boolean;
}

export function DiskUsageBlock({ usage, instance, loading }: DiskUsageBlockProps) {
	const storageUsage = measureStorageUsage(usage ?? []);

	const storageMax = useMemo(() => {
		return computeStorageSize(instance?.type);
	}, [instance?.type]);

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 90 ? "red" : "blue";

	return (
		<Paper
			p="xl"
			component={Stack}
			gap={0}
		>
			<Group>
				<Icon
					path={iconDatabase}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Disk Usage
				</Text>
			</Group>
			<Divider my="md" />
			<Box pos="relative">
				<DonutChart
					mt="sm"
					size={180}
					mx="auto"
					thickness={8}
					paddingAngle={8}
					startAngle={90}
					endAngle={-270}
					data={[
						{ name: "Used", value: 200, color: "blue" },
						{ name: "Total", value: 300, color: "slate" },
					]}
				/>
				<Center
					pos="absolute"
					inset={0}
				>
					<Box ta="center">
						<Text
							c="bright"
							fw={600}
							fz={20}
						>
							{storageUsageMB}
						</Text>
						<Text fz="sm">3.6 GB remaining</Text>
					</Box>
				</Center>
			</Box>
			{/* <Group my="md">
				<Box flex={1}>
					<Text
						c="bright"
						fw={500}
						fz="lg"
					>
						Total disk usage
					</Text>
					<Text fz="sm">Current disk utilization</Text>
				</Box>
				<Text
					c="bright"
					fw={600}
					fz={20}
				>
					{storageUsageMB}
				</Text>
			</Group>

			<Progress
				value={storageFrac}
				color={storageColor}
				size="sm"
			/>

			<Text mt="sm">
				You have used {storageFrac.toFixed(2)}% of your {storageMaxMB} storage limit
			</Text> */}
		</Paper>
	);
}
