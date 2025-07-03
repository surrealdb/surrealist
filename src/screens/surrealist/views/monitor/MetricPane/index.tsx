import { Paper, Stack } from "@mantine/core";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { iconChart, iconChevronRight } from "~/util/icons";
import { MetricActions } from "./actions";
import { MonitorContentProps, MonitorMetricOptions } from "../helpers";
import { CloudMetrics } from "~/types";
import { SystemPanel } from "./metrics/system";
import { NetworkPanel } from "./metrics/network";
import { ConnectionsPanel } from "./metrics/connections";

export interface SharedMetricsPanelProps {
	instance: string | undefined;
	metricOptions: MonitorMetricOptions;
	onCalculateMetricsNodes?: (metric: CloudMetrics) => void;
}

export function MetricPane({
	info,
	instance,
	metricOptions,
	sidebarMinimized,
	onRevealSidebar,
	onChangeMetricsOptions,
	onCalculateMetricsNodes,
}: MonitorContentProps) {
	return (
		<Stack h="100%">
			<ContentPane
				h="unset"
				icon={iconChart}
				title={info.name}
				withDivider={false}
				leftSection={
					sidebarMinimized && (
						<ActionButton
							label="Reveal monitors"
							mr="sm"
							color="slate"
							variant="light"
							onClick={onRevealSidebar}
							aria-label="Reveal observables"
						>
							<Icon path={iconChevronRight} />
						</ActionButton>
					)
				}
				rightSection={
					<MetricActions
						options={metricOptions}
						onChange={onChangeMetricsOptions}
					/>
				}
			/>
			<Paper
				bg="transparent"
				flex={1}
				p="xl"
			>
				{info.id === "system" && (
					<SystemPanel
						instance={instance}
						metricOptions={metricOptions}
						onCalculateMetricsNodes={onCalculateMetricsNodes}
					/>
				)}
				{info.id === "network" && (
					<NetworkPanel
						instance={instance}
						metricOptions={metricOptions}
						onCalculateMetricsNodes={onCalculateMetricsNodes}
					/>
				)}
				{info.id === "connections" && (
					<ConnectionsPanel
						instance={instance}
						metricOptions={metricOptions}
						onCalculateMetricsNodes={onCalculateMetricsNodes}
					/>
				)}
			</Paper>
		</Stack>
	);
}
