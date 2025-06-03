import { Center, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { AreaChart, ChartTooltip } from "@mantine/charts";
import { Icon } from "~/components/Icon";
import { CloudMetrics, MetricsDuration } from "~/types";
import { iconHelp } from "~/util/icons";
import dayjs from "dayjs";
import { computeMetricRange } from "~/cloud/helpers";
import { format } from "date-fns";
import { useStable } from "~/hooks/stable";
import { formatMemory } from "~/util/helpers";

export interface MemoryUsageChartProps {
	metrics: CloudMetrics | undefined;
	duration: MetricsDuration;
	isLoading: boolean;
}

export function MemoryUsageChart({ metrics, duration, isLoading }: MemoryUsageChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const [startAt, endAt] = computeMetricRange(duration);

	const series = data.map((metric) => ({
		name: metric.labels,
		color: "surreal",
		label: `Memory usage (${metric.labels})`,
	}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			time: dayjs(timestamp).valueOf(),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data / 1000000);
			}
		}

		return value;
	});

	const tooltip = useStable(({ label, payload }) => {
		return (
			<ChartTooltip
				label={label ? format(label as number, "hh:mm") : label}
				payload={payload}
				series={series}
				valueFormatter={(value: number) => formatMemory(value)}
			/>
		);
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
							data={values}
							withDots={false}
							dataKey="time"
							flex={1}
							series={series}
							tooltipProps={{
								content: tooltip,
							}}
							yAxisProps={{
								interval: 0,
								tickFormatter(value) {
									return formatMemory(value as number);
								},
							}}
							xAxisProps={{
								scale: "time",
								type: "number",
								interval: "equidistantPreserveStart",
								domain: [startAt.valueOf(), endAt.valueOf()],
								tickFormatter(value) {
									return format(value as number, "hh:mm");
								},
							}}
						/>
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
