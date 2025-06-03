import { Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart } from '@mantine/charts';
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconHelp } from "~/util/icons";
import dayjs from "dayjs";

export interface CpuUsageChartProps {
	metrics: CloudMetrics | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function CpuUsageChart({ metrics, instance, isLoading }: CpuUsageChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const values = timestamps?.map((timestamp, i) => ({
		label: dayjs(timestamp).format("HH:mm"),
		memory: (data[0].values[i] ?? 0).toFixed(2),
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
						vCPU Usage
					</Text>

					<Tooltip label="The average CPU core usage measured in vCPU(s) per second">
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
						Recording CPU usage...
					</Text>
				)}
				
				{values.length >= 2 && (
					<AreaChart
						withDots={false}
						unit={" " + (metrics?.unit ?? "vCPU(s)/sec")}
						yAxisProps={{
							unit: "",
							interval: 0
						}}
						xAxisProps={{
							interval: Math.floor(timestamps.length / 5)
						}}
						dataKey="label"
						h={200}
						series={[{ name: "memory", color: "surreal", label: "CPU Usage" }]}
						data={values}
					/>
				)}
			</Paper>
		</Skeleton>
	);
}
