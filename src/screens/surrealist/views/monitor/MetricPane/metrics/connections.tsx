import { Stack } from "@mantine/core";
import { RPCConnectionsChart } from "~/screens/surrealist/metrics/RPCConnectionsChart";
import { SharedMetricsPanelProps } from "..";

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
