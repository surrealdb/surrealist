import { ChartTooltip } from "@mantine/charts";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useStable } from "~/hooks/stable";
import { BaseAreaChart, CommonAreaChartProps } from "../BaseAreaChart";

export function HTTPRequestsChart({
	instance,
	duration,
	height,
	nodeFilter,
	onCalculateMetricsNodes,
}: CommonAreaChartProps) {
	const { data: metrics, isPending } = useCloudMetricsQuery(instance, "http_requests", duration);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Results in infinite loop
	useEffect(() => {
		if (metrics) {
			onCalculateMetricsNodes?.(metrics);
		}
	}, [metrics]);

	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const series = data
		.filter((dat) => nodeFilter === undefined || nodeFilter.includes(dat.labels))
		.map((metric) => ({
			name: metric.labels,
			color: "surreal",
			label: `HTTP Requests (${metric.labels})`,
		}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			time: dayjs(timestamp).valueOf(),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data * 1000) / 1000;
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
				unit=" req/s"
			/>
		);
	});

	return (
		<BaseAreaChart
			isLoading={isPending}
			title="HTTP Requests"
			information="The volume of incoming HTTP requests."
			duration={duration}
			values={values}
			series={series}
			tooltip={tooltip}
			height={height}
		/>
	);
}
