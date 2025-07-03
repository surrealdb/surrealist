import { Stack } from "@mantine/core";
import { SharedMetricsPanelProps } from "..";
import { RPCConnectionsChart } from "~/screens/surrealist/metrics/RPCConnectionsChart";

export function ConnectionsPanel({
	instance,
	metricOptions,
	onCalculateMetricsNodes,
}: SharedMetricsPanelProps) {
	return (
		<Stack gap="xl">
			<RPCConnectionsChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
		</Stack>
	);
}
