import { Box } from "@mantine/core";

import { memo, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { useImmer } from "use-immer";
import { PanelDragger } from "~/components/Pane/dragger";
import { MONITORS } from "~/constants";
import { usePanelMinSize } from "~/hooks/panels";
import { useStable } from "~/hooks/stable";
import { MonitorType } from "~/types";
import { LogPane } from "../LogPane";
import { MetricPane } from "../MetricPane";
import { MonitorsPane } from "../MonitorsPane";
import { MonitorContentProps, MonitorLogOptions, MonitorMetricOptions } from "../helpers";

const MONITOR_CONTENTS: Record<MonitorType, React.FC<MonitorContentProps>> = {
	metrics: memo(MetricPane),
	logs: memo(LogPane),
};

export default function MonitorView() {
	const [minSidebarSize, rootRef] = usePanelMinSize(275);
	const [sidebarMinimized, setSidebarMinimized] = useState(false);
	const [activeMonitor, setActiveMonitor] = useState("system");

	const monitorInfo = MONITORS[activeMonitor];
	const Content = MONITOR_CONTENTS[monitorInfo.type];

	const revealSidebar = useStable(() => {
		setSidebarMinimized(false);
	});

	const [metricOptions, setMetricOptions] = useImmer<MonitorMetricOptions>({
		duration: "hour",
		nodeFilter: undefined,
		nodes: [],
	});

	const [logOptions, setLogOptions] = useImmer<MonitorLogOptions>({
		level: null,
		duration: "hour",
	});

	// const [metricsDuration, setMetricsDuration] = useInputState<MetricsDuration>("hour");
	// const [metricsNodeFilter, setMetricsNodeFilter] = useInputState<string[] | undefined>(
	// 	undefined,
	// );

	// const [metricsNodes, setMetricsNodes] = useInputState<string[]>([]);
	// const [networkIngressLabels, setNetworkIngressLabels] = useState<string[]>([]);
	// const [networkEgressLabels, setNetworkEgressLabels] = useState<string[]>([]);
	// const [memoryLabels, setMemoryLabels] = useState<string[]>([]);
	// const [cpuLabels, setCpuLabels] = useState<string[]>([]);
	// const [activeRPCLabels, setActiveRPCLabels] = useState<string[]>([]);

	// useEffect(() => {
	// 	const nodes = new Set<string>();

	// 	for (const label of memoryLabels) {
	// 		nodes.add(label);
	// 	}

	// 	for (const label of cpuLabels) {
	// 		nodes.add(label);
	// 	}

	// 	for (const label of networkEgressLabels) {
	// 		nodes.add(label);
	// 	}

	// 	for (const label of networkIngressLabels) {
	// 		nodes.add(label);
	// 	}

	// 	for (const label of activeRPCLabels) {
	// 		nodes.add(label);
	// 	}

	// 	setMetricsNodes(Array.from(nodes));
	// }, [memoryLabels, cpuLabels, networkEgressLabels, networkIngressLabels, activeRPCLabels]);

	// // biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	// useEffect(() => {
	// 	setMetricsNodeFilter(undefined);
	// }, [metricsDuration]);

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
								<MonitorsPane
									active={activeMonitor}
									onSidebarMinimize={() => {
										setSidebarMinimized(true);
									}}
									onActivate={(observable) => {
										setActiveMonitor(observable);
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
						<Content
							info={monitorInfo}
							metricOptions={metricOptions}
							logOptions={logOptions}
							sidebarMinimized={sidebarMinimized}
							onRevealSidebar={revealSidebar}
							onChangeMetricsOptions={setMetricOptions}
							onChangeLogOptions={setLogOptions}
						/>
					</Panel>
				</PanelGroup>
			</Box>
		</>
	);
}
