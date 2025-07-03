import { ChartTooltip } from "@mantine/charts";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useStable } from "~/hooks/stable";
import { BaseAreaChart, CommonAreaChartProps } from "../ObserverChart";

export function ComputeUsageChart({
	instance,
	duration,
	hideHeader,
	nodeFilter,
	calculateNodes,
}: CommonAreaChartProps) {
	const { data: metrics, isPending } = useCloudMetricsQuery(instance, "cpu", duration);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Results in infinite loop
	useEffect(() => {
		if (metrics) {
			calculateNodes(metrics);
		}
	}, [metrics]);

	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

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
				value[metric.labels] = Math.round(data * 100) / 100;
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
		<BaseAreaChart
			isLoading={isPending}
			title="Compute usage"
			information="The CPU core usage measured in vCPU(s)"
			duration={duration}
			values={values}
			series={series}
			tooltip={tooltip}
			hideHeader={hideHeader}
		/>
	);
}
