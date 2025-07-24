import { Stack } from "@mantine/core";
import { HTTPRequestsChart } from "~/screens/surrealist/metrics/HTTPRequestsChart";
import { RPCRequestsChart } from "~/screens/surrealist/metrics/RPCRequestsChart";
import { SharedMetricsPanelProps } from "..";

export function ConnectionsPanel({
	instance,
	metricOptions,
	onCalculateMetricsNodes,
}: SharedMetricsPanelProps) {
	return (
		<Stack gap="xl">
			<RPCRequestsChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
			<HTTPRequestsChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
		</Stack>
	);
}
