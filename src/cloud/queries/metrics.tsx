import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudMetrics, MetricsDuration, MetricsType } from "~/types";
import { fetchAPI } from "../api";
import { computeMetricRange } from "../helpers";

/**
 * Fetch instance metrics
 */
export function useCloudMetricsQuery(
	instance: string | undefined,
	metric: MetricsType,
	duration: MetricsDuration,
	dummy_data?: boolean,
) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "metrics", metric, duration, instance],
		enabled: !!instance && authState === "authenticated",
		refetchInterval: 60_000,
		queryFn: async () => {
			const [startAt, endAt] = computeMetricRange(duration);

			const params = new URLSearchParams({
				metric,
				from_time: startAt.toISOString(),
				to_time: endAt.toISOString(),
			});

			if (dummy_data) {
				params.append("dummy_data", "true");
			}

			return fetchAPI<CloudMetrics>(`/instances/${instance}/metrics?${params.toString()}`);
		},
	});
}
