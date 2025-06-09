import { AreaChart, ChartTooltip } from "@mantine/charts";
import { Center, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import { format } from "date-fns";
import dayjs from "dayjs";
import { computeMetricRange } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { CloudMetrics, MetricsDuration } from "~/types";
import { iconHelp } from "~/util/icons";

export interface ComputeUsageChartProps {
	metrics: CloudMetrics | undefined;
	duration: MetricsDuration;
	nodeFilter?: string[];
	isLoading: boolean;
}

export function ComputeUsageChart({
	metrics,
	duration,
	nodeFilter,
	isLoading,
}: ComputeUsageChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const [startAt, endAt] = computeMetricRange(duration);

	const series = data
		.filter((dat) => nodeFilter === undefined || nodeFilter.includes(dat.labels))
		.map((metric) => ({
			name: metric.labels,
			color: "surreal",
			label: `vCPU(s)/sec (${metric.labels})`,
		}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			time: dayjs(timestamp).valueOf(),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = data.toFixed(2);
			}
		}

		return value;
	});

	const tooltip = useStable(({ label, payload }) => {
		return (
			<ChartTooltip
				label={label ? format(label as number, "MMMM d, yyyy - h:mm a") : label}
				payload={payload}
				series={series}
				unit=" vCPU(s)"
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
						<Text c="slate">Recording compute activity...</Text>
					</Center>
				) : (
					<>
						<Group gap="xs">
							<Text
								c="bright"
								fw={700}
								fz="xl"
							>
								Compute usage
							</Text>

							<Tooltip label="The CPU core usage measured in vCPU(s)">
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
							}}
							xAxisProps={{
								scale: "time",
								type: "number",
								interval: "equidistantPreserveStart",
								minTickGap: 15,
								domain: [startAt.valueOf(), endAt.valueOf()],
								tickFormatter(value) {
									return ["week", "month"].includes(duration)
										? format(value as number, "M/d/yy")
										: format(value as number, "hh:mm");
								},
							}}
						/>
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
