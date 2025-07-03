import { ChartTooltip } from "@mantine/charts";
import { format } from "date-fns";
import dayjs from "dayjs";
import { useEffect } from "react";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useStable } from "~/hooks/stable";
import { BaseAreaChart, CommonAreaChartProps } from "../BaseAreaChart";

export function RPCConnectionsChart({
	instance,
	duration,
	height,
	nodeFilter,
	onCalculateMetricsNodes,
}: CommonAreaChartProps) {
	const { data: metrics, isPending } = useCloudMetricsQuery(
		instance,
		"rpc_active_connections",
		duration,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Results in infinite loop
	useEffect(() => {
		if (metrics) {
			onCalculateMetricsNodes?.(metrics);
		}
	}, [metrics]);

	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	let max = 0;
	let min = 0;

	console.log(metrics);

	const series = data
		.filter((dat) => nodeFilter === undefined || nodeFilter.includes(dat.labels))
		.map((metric) => ({
			name: metric.labels,
			color: "surreal",
			label: `Active connections (${metric.labels})`,
		}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			time: dayjs(timestamp).valueOf(),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				if (data > max) {
					max = data;
				}

				if (data < min) {
					min = data;
				}

				value[metric.labels] = data;
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
				unit=" connection(s)"
			/>
		);
	});

	return (
		<BaseAreaChart
			isLoading={isPending}
			title="Active RPC Connections"
			information="The number of active RPC connections to the instance."
			duration={duration}
			values={values}
			series={series}
			tooltip={tooltip}
			height={height}
			yAxisDomain={[min, Math.ceil(max / 4) * 4]}
		/>
	);
}
