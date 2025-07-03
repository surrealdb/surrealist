import { Updater } from "use-immer";
import { MetricsDuration, Monitor } from "~/types";

export interface MonitorMetricOptions {
	duration: MetricsDuration;
	nodeFilter: string[] | undefined;
	nodes: string[];
}

export interface MonitorLogOptions {
	search: string;
	level: string | null;
	duration: MetricsDuration;
}

export interface MonitorContentProps {
	info: Monitor;
	sidebarMinimized: boolean;
	metricOptions: MonitorMetricOptions;
	logOptions: MonitorLogOptions;
	onChangeMetricsOptions: Updater<MonitorMetricOptions>;
	onChangeLogOptions: Updater<MonitorLogOptions>;
	onRevealSidebar: () => void;
}
