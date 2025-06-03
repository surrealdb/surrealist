import {
	Badge,
	Center,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { AreaChart, BarChart } from "@mantine/charts";
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconArrowDownFat, iconHelp } from "~/util/icons";
import dayjs from "dayjs";

export interface NetworkIngressChartProps {
	metrics: CloudMetrics | undefined;
	isLoading: boolean;
}

export function NetworkIngressChart({ metrics, isLoading }: NetworkIngressChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const series = data.map((metric) => ({
		name: metric.labels,
		color: "surreal",
		label: `Ingress traffic (${metric.labels})`,
	}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			label: dayjs(timestamp).format("HH:mm"),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data / 1000);
			}
		}

		return value;
	});

	return (
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={24}
				component={Stack}
				pos="relative"
				h={280}
			>
				{values.length < 2 ? (
					<Center flex={1}>
						<Text c="slate">Recording ingress network traffic...</Text>
					</Center>
				) : (
					<>
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
						<AreaChart
							withDots={false}
							unit=" kb/s"
							yAxisProps={{
								unit: " kb/s",
								interval: 0,
							}}
							xAxisProps={{
								interval: Math.floor(timestamps.length / 5),
							}}
							dataKey="label"
							flex={1}
							series={series}
							data={values}
						/>
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
