import { Badge, Divider, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart, BarChart } from '@mantine/charts';
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconArrowDownFat, iconArrowUpRight, iconHelp } from "~/util/icons";
import dayjs from "dayjs";

export interface NetworkEgressChartProps {
	metrics: CloudMetrics | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function NetworkEgressChart({ metrics, instance, isLoading }: NetworkEgressChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const values = timestamps?.map((timestamp, i) => ({
		label: dayjs(timestamp).format("HH:mm"),
		egress: Math.round((data[0].values[i] ?? 0) / 1000),
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
						Network Egress
					</Text>
							
					<Tooltip label="The average outgoing network traffic measured in bytes per second">
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
						Recording Network Egress data...
					</Text>
				)}
				
				{values.length >= 2 && (
					<AreaChart
						withDots={false}
						unit=" kb/s"
						yAxisProps={{
							unit: " kb/s",
							interval: 0
						}}
						xAxisProps={{
							interval: Math.floor(timestamps.length / 5)
						}}
						dataKey="label"
						h={200}
						series={[{ name: "egress", color: "surreal", label: "Egress" }]}
						data={values}
					/>
				)}
			</Paper>
		</Skeleton>
	);
}
