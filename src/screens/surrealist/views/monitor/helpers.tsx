import { Updater } from "use-immer";
import { Monitor } from "~/types";

export interface MonitorMetricOptions {
	duration: "hour" | "half" | "day" | "week" | "month";
	nodeFilter: string[] | undefined;
	nodes: string[];
}

export interface MonitorContentProps {
	info: Monitor;
	sidebarMinimized: boolean;
	metricOptions: MonitorMetricOptions;
	onChangeMetricsOptions: Updater<MonitorMetricOptions>;
	onRevealSidebar: () => void;
}
