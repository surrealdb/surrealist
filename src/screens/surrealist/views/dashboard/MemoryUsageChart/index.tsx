import { Badge, Divider, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart, BarChart } from '@mantine/charts';
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconArrowDownFat, iconArrowUpRight, iconHelp, iconMemory } from "~/util/icons";
import dayjs from "dayjs";

export interface MemoryUsageChartProps {
	metrics: CloudMetrics | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function MemoryUsageChart({ metrics, instance, isLoading }: MemoryUsageChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const values = timestamps?.map((timestamp, i) => ({
		label: dayjs(timestamp).format("HH:mm"),
		memory: (Math.round(data[0].values[i] / 1000000) ?? 0),
	}));

	return (
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={24}
				component={Stack}
				pos="relative"
				mih={200}
			>
				<Group gap="xs">
					<Text
						c="bright"
						fw={700}
						fz="xl"
					>
						Memory Usage
					</Text>
					
					<Tooltip label="The average amount of memory used by the instance in megabytes.">
						<div>
							<Icon
								path={iconHelp}
								size="sm"
							/>
						</div>
					</Tooltip>
				</Group>

				{values.length < 2 && (
					<Text c="dimmed" fz="sm">
						Recording Memory usage...
					</Text>
				)}
				
				{values.length >= 2 && (
					<AreaChart
						withDots={false}
						unit=" MB"
						dataKey="label"
						h={200}
						series={[{ name: "memory", color: "surreal", label: "Memory Usage" }]}
						yAxisProps={{
							interval: 0
						}}
						xAxisProps={{
							interval: Math.floor(timestamps.length / 5)
						}}
						data={values}
					/>
				)}
			</Paper>
		</Skeleton>
	);
}
