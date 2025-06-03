import { Badge, Divider, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart, BarChart } from '@mantine/charts';
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconArrowDownFat, iconHelp } from "~/util/icons";
import dayjs from "dayjs";

export interface NetworkIngressChartProps {
	metrics: CloudMetrics | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function NetworkIngressChart({ metrics, instance, isLoading }: NetworkIngressChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const values = timestamps?.map((timestamp, i) => ({
		label: dayjs(timestamp).format("HH:mm"),
		ingress: Math.round((data[0].values[i] ?? 0) / 1000),
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
						Network Ingress
					</Text>
										
					<Tooltip label="The average incoming network traffic measured in bytes per second">
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
						Recording Network Ingress data...
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
						series={[{ name: "ingress", color: "surreal", label: "Ingress" }]}
						data={values}
					/>
				)}
			</Paper>
		</Skeleton>
	);
}
