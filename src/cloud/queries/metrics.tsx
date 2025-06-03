import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { fetchAPI } from "../api";
import { CloudMetrics, MetricsDuration, MetricsType } from "~/types";
import dayjs from "dayjs";

/**
 * Fetch instance metrics
 */
export function useCloudMetricsQuery(instance: string | undefined, metric: MetricsType, duration?: MetricsDuration, from?: Date, to?: Date, dummy_data?: boolean) {
	const authState = useCloudStore((state) => state.authState);
	const params = new URLSearchParams({
		metric
	});
	
	const oneHourAgo = dayjs().subtract(1, "hour").toISOString();
	const twelveHoursAgo = dayjs().subtract(12, "hour").toISOString();
	const oneDayAgo = dayjs().subtract(1, "day").toISOString();
	const oneWeekAgo = dayjs().subtract(1, "week").toISOString();
	const oneMonthAgo = dayjs().subtract(29, "day").toISOString();

	if (dummy_data) {
		params.append("dummy_data", "true");
	}

	if (from) {
		params.append("from_time", from.toISOString());
	} else if (duration === "hour") {
		params.append("from_time", oneHourAgo);
	} else if (duration === "12hr") {
		params.append("from_time", twelveHoursAgo);
	} else if (duration === "day") {
		params.append("from_time", oneDayAgo);
	} else if (duration === "week") {
		params.append("from_time", oneWeekAgo);
	} else if (duration === "month") {
		params.append("from_time", oneMonthAgo);
	}

	if (to) {
		params.append("to_time", to.toISOString());
	}

	return useQuery({
		queryKey: ["cloud", "metrics", metric, duration, instance],
		enabled: !!instance && authState === "authenticated",
		refetchInterval: 60_000,
		queryFn: async () => {
			return fetchAPI<CloudMetrics>(`/instances/${instance}/metrics?${params.toString()}`);
		},
	});
}