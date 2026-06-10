import { Box, Group, ScrollArea, Stack } from "@mantine/core";
import { Icon, iconChevronRight, SectionTitle, Spacer } from "@surrealdb/ui";
import { ActionButton } from "~/components/ActionButton";
import { CloudMetrics } from "~/types";
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
			<Box
				pos="relative"
				flex={1}
			>
				<ScrollArea
					scrollbars="y"
					pos="absolute"
					inset={0}
				>
					<Box
						pt="2xl"
						px="xl"
						maw={960}
						mx="auto"
					>
						<Group mb="xl">
							{sidebarMinimized && (
								<ActionButton
									label="Reveal monitors"
									mr="sm"
									onClick={onRevealSidebar}
									aria-label="Reveal observables"
								>
									<Icon path={iconChevronRight} />
								</ActionButton>
							)}
							<SectionTitle kicker="Metrics">{info.name}</SectionTitle>
							<Spacer />
							<MetricActions
								options={metricOptions}
								onChange={onChangeMetricsOptions}
							/>
						</Group>

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
					</Box>
				</ScrollArea>
			</Box>
		</Stack>
	);
}
