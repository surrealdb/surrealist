import { Stack } from "@mantine/core";
import { SharedMetricsPanelProps } from "..";
import { ComputeUsageChart } from "~/screens/surrealist/metrics/ComputeUsageChart";
import { MemoryUsageChart } from "~/screens/surrealist/metrics/MemoryUsageChart";

export function SystemPanel({
	instance,
	metricOptions,
	onCalculateMetricsNodes,
}: SharedMetricsPanelProps) {
	return (
		<Stack gap="xl">
			<ComputeUsageChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
			<MemoryUsageChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
		</Stack>
	);
}
