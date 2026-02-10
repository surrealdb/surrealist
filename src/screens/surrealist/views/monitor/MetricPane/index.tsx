import { Paper, ScrollArea, Stack } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { ActionButton } from "~/components/ActionButton";
import { ContentPane } from "~/components/Pane";
import { CloudMetrics } from "~/types";
import { iconChart, iconChevronRight } from "~/util/icons";
import { MonitorContentProps, MonitorMetricOptions } from "../helpers";
import { MetricActions } from "./actions";
import { ConnectionsPanel } from "./metrics/connections";
import { NetworkPanel } from "./metrics/network";
import { SystemPanel } from "./metrics/system";

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
				pos="relative"
				flex={1}
			>
				<ScrollArea
					scrollbars="y"
					pos="absolute"
					p="xl"
					inset={0}
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
				</ScrollArea>
			</Paper>
		</Stack>
	);
}
