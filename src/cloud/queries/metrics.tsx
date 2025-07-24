import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudMetrics, MetricsDuration } from "~/types";
import { withSearchParams } from "~/util/helpers";
import { fetchAPI } from "../api";
import { computeMetricRange } from "../helpers";

/**
 * Fetch instance metrics
 */
export function useCloudMetricsQuery(
	instance: string | undefined,
	metric: string,
	duration: MetricsDuration,
	dummy_data?: boolean,
) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "metrics", instance, { metric, duration }],
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

			return fetchAPI<CloudMetrics>(
				withSearchParams(`/instances/${instance}/metrics`, params),
			);
		},
	});
}
