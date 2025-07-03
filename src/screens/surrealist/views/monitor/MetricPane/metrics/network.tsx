import { Stack } from "@mantine/core";
import { SharedMetricsPanelProps } from "..";
import { NetworkIngressChart } from "~/screens/surrealist/metrics/NetworkIngressChart";
import { NetworkEgressChart } from "~/screens/surrealist/metrics/NetworkEgressChart";

export function NetworkPanel({
	instance,
	metricOptions,
	onCalculateMetricsNodes,
}: SharedMetricsPanelProps) {
	return (
		<Stack gap="xl">
			<NetworkIngressChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
			<NetworkEgressChart
				instance={instance}
				nodeFilter={metricOptions.nodeFilter}
				duration={metricOptions.duration}
				onCalculateMetricsNodes={onCalculateMetricsNodes}
			/>
		</Stack>
	);
}
