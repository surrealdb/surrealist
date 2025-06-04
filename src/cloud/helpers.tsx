import { Duration, sub } from "date-fns";
import { useConfigStore } from "~/stores/config";
import { CloudOrganization, MetricsDuration } from "~/types";

export function clearCachedConnections() {
	const { connections } = useConfigStore.getState();

	const pruned = connections.filter((connection) => connection.authentication.mode !== "cloud");

	useConfigStore.setState((s) => {
		s.connections = pruned;
	});
}

export function createInstancePath(organization?: CloudOrganization) {
	if (!organization) {
		return "/create/instance";
	}

	return `/create/instance?organization=${organization.id}`;
}

const METRIC_DURATION_MAP: Record<MetricsDuration, Duration> = {
	hour: { hours: 1 },
	half: { hours: 12 },
	day: { days: 1 },
	week: { weeks: 1 },
	month: { days: 29 },
};

export function computeMetricRange(duration: MetricsDuration): [Date, Date] {
	const end = new Date();
	const start = sub(end, METRIC_DURATION_MAP[duration]);

	return [start, end];
}
