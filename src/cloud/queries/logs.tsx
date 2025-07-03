import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudLogs, MetricsDuration } from "~/types";
import { withSearchParams } from "~/util/helpers";
import { fetchAPI } from "../api";
import { computeMetricRange } from "../helpers";

/**
 * Fetch instance logs
 */
export function useCloudLogsQuery(instance: string | undefined, duration: MetricsDuration) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "logs", instance, { duration }],
		enabled: !!instance && authState === "authenticated",
		// refetchInterval: 60_000,
		queryFn: async () => {
			const [startAt, endAt] = computeMetricRange(duration);

			const params = new URLSearchParams({
				from_time: startAt.toISOString(),
				to_time: endAt.toISOString(),
				category: "dummy_data",
			});

			return fetchAPI<CloudLogs>(withSearchParams(`/instances/${instance}/logs`, params));
		},
	});
}
