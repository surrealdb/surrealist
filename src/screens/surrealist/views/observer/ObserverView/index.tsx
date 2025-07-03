import { Box, Paper, SimpleGrid, Stack } from "@mantine/core";

import { objectify } from "radash";
import { useInputState } from "@mantine/hooks";
import { useEffect, useMemo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { PanelDragger } from "~/components/Pane/dragger";
import { useConnection } from "~/hooks/connection";
import { usePanelMinSize } from "~/hooks/panels";
import { MetricsDuration } from "~/types";
import { iconChevronRight } from "~/util/icons";
import { ObservablesPane } from "../ObservablesPane";
import { ObserverActions } from "../ObserverActions";
import { RPCConnectionsChart } from "~/screens/surrealist/metrics/RPCConnectionsChart";
import { OBSERVABLE_LOG_FEEDS, OBSERVABLE_METRIC_COLLECTIONS } from "~/constants";
import { ComputeUsageChart } from "~/screens/surrealist/metrics/ComputeUsageChart";
import { MemoryUsageChart } from "~/screens/surrealist/metrics/MemoryUsageChart";
import { NetworkIngressChart } from "~/screens/surrealist/metrics/NetworkIngressChart";
import { NetworkEgressChart } from "~/screens/surrealist/metrics/NetworkEgressChart";

interface ObserverChartWrapperProps {
	children: React.ReactNode;
}

function ObserverChartWrapper({ children }: ObserverChartWrapperProps) {
	return (
		<Paper
			p="xl"
			component={Stack}
			bg="slate.8"
			pos="relative"
			h={"calc(50vh - 5.3rem)"}
		>
			{children}
		</Paper>
	);
}

export default function ObserverView() {
	const [instance] = useConnection((c) => [c?.authentication.cloudInstance]);

	const [minSidebarSize, rootRef] = usePanelMinSize(275);
	const [sidebarMinimized, setSidebarMinimized] = useState(false);
	const [metricsDuration, setMetricsDuration] = useInputState<MetricsDuration>("hour");
	const [activeCategory, setActiveCategory] = useState("system");
	const [metricsNodeFilter, setMetricsNodeFilter] = useInputState<string[] | undefined>(
		undefined,
	);

	const [metricsNodes, setMetricsNodes] = useInputState<string[]>([]);
	const [networkIngressLabels, setNetworkIngressLabels] = useState<string[]>([]);
	const [networkEgressLabels, setNetworkEgressLabels] = useState<string[]>([]);
	const [memoryLabels, setMemoryLabels] = useState<string[]>([]);
	const [cpuLabels, setCpuLabels] = useState<string[]>([]);
	const [activeRPCLabels, setActiveRPCLabels] = useState<string[]>([]);

	const metricCollectionMap = useMemo(() => {
		return objectify(
			OBSERVABLE_METRIC_COLLECTIONS,
			(it) => it.id,
			(it) => it,
		);
	}, []);

	const logsFeedMap = useMemo(() => {
		return objectify(
			OBSERVABLE_LOG_FEEDS,
			(it) => it.id,
			(it) => it,
		);
	}, []);

	useEffect(() => {
		const nodes = new Set<string>();

		for (const label of memoryLabels) {
			nodes.add(label);
		}

		for (const label of cpuLabels) {
			nodes.add(label);
		}

		for (const label of networkEgressLabels) {
			nodes.add(label);
		}

		for (const label of networkIngressLabels) {
			nodes.add(label);
		}

		for (const label of activeRPCLabels) {
			nodes.add(label);
		}

		setMetricsNodes(Array.from(nodes));
	}, [memoryLabels, cpuLabels, networkEgressLabels, networkIngressLabels, activeRPCLabels]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	useEffect(() => {
		setMetricsNodeFilter(undefined);
	}, [metricsDuration]);

	return (
		<>
			<Box
				h="100%"
				ref={rootRef}
				pr="lg"
				pb="lg"
			>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSidebarSize === 0 ? 0 : 1 }}
				>
					{!sidebarMinimized && (
						<>
							<Panel
								defaultSize={minSidebarSize}
								minSize={minSidebarSize}
								maxSize={35}
								id="tabs"
								order={1}
							>
								<ObservablesPane
									activeCategory={activeCategory}
									onSidebarMinimize={() => {
										setSidebarMinimized(true);
									}}
									onActivate={(observable) => {
										setActiveCategory(observable);
									}}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel
						id="content"
						order={2}
					>
						<ContentPane
							title={`TODO`}
							// icon={category.icon}
							leftSection={
								sidebarMinimized && (
									<ActionButton
										label="Reveal observables"
										mr="sm"
										color="slate"
										variant="light"
										onClick={() => {
											setSidebarMinimized(false);
										}}
										aria-label="Reveal observables"
									>
										<Icon path={iconChevronRight} />
									</ActionButton>
								)
							}
							rightSection={
								<ObserverActions
									metricsDuration={metricsDuration}
									setMetricsDuration={setMetricsDuration}
									metricsNodeFilter={metricsNodeFilter}
									setMetricsNodeFilter={setMetricsNodeFilter}
									metricsNodes={metricsNodes}
								/>
							}
						>
							<SimpleGrid>
								{activeCategory === "system" && (
									<ObserverChartWrapper>
										<ComputeUsageChart
											hideHeader
											instance={instance}
											duration={metricsDuration}
											nodeFilter={metricsNodeFilter}
											calculateNodes={(metrics) => {
												setCpuLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</ObserverChartWrapper>
								)}
								{activeCategory === "system" && (
									<ObserverChartWrapper>
										<MemoryUsageChart
											hideHeader
											instance={instance}
											duration={metricsDuration}
											nodeFilter={metricsNodeFilter}
											calculateNodes={(metrics) => {
												setMemoryLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</ObserverChartWrapper>
								)}
								{activeCategory === "network" && (
									<ObserverChartWrapper>
										<NetworkIngressChart
											hideHeader
											instance={instance}
											duration={metricsDuration}
											nodeFilter={metricsNodeFilter}
											calculateNodes={(metrics) => {
												setNetworkIngressLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</ObserverChartWrapper>
								)}
								{activeCategory === "network" && (
									<ObserverChartWrapper>
										<NetworkEgressChart
											hideHeader
											instance={instance}
											duration={metricsDuration}
											nodeFilter={metricsNodeFilter}
											calculateNodes={(metrics) => {
												setNetworkEgressLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</ObserverChartWrapper>
								)}
								{activeCategory === "connections" && (
									<ObserverChartWrapper>
										<RPCConnectionsChart
											hideHeader
											instance={instance}
											duration={metricsDuration}
											nodeFilter={metricsNodeFilter}
											calculateNodes={(metrics) => {
												setActiveRPCLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</ObserverChartWrapper>
								)}
							</SimpleGrid>
						</ContentPane>
					</Panel>
				</PanelGroup>
			</Box>
		</>
	);
}
