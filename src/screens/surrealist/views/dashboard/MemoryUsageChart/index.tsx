import { Center, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart } from "@mantine/charts";
import { Icon } from "~/components/Icon";
import { CloudInstance, CloudMetrics } from "~/types";
import { iconHelp } from "~/util/icons";
import dayjs from "dayjs";

export interface MemoryUsageChartProps {
	metrics: CloudMetrics | undefined;
	instance: CloudInstance | undefined;
	isLoading: boolean;
}

export function MemoryUsageChart({ metrics, instance, isLoading }: MemoryUsageChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const series = data.map((metric) => ({
		name: metric.labels,
		color: "surreal",
		label: `Memory usage (${metric.labels})`,
	}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			label: dayjs(timestamp).format("HH:mm"),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data / 1000000);
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
						<Text c="slate">Recording memory usage...</Text>
					</Center>
				) : (
					<>
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
						<AreaChart
							withDots={false}
							unit=" MB"
							dataKey="label"
							flex={1}
							series={series}
							yAxisProps={{
								interval: 0,
							}}
							xAxisProps={{
								interval: Math.floor(timestamps.length / 5),
							}}
							data={values}
						/>
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
