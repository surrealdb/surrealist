import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import { CloudLogs, MetricsDuration } from "~/types";
import { withSearchParams } from "~/util/helpers";
import { fetchAPI } from "../api";
import { computeMetricRange } from "../helpers";

/**
 * Fetch instance logs
 */
export function useCloudLogsQuery(instance: string | undefined, duration: MetricsDuration) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "logs", instance, { duration }],
		enabled: !!instance && isAuthenticated && hasCloudSession,
		// refetchInterval: 60_000,
		queryFn: async () => {
			const [startAt, endAt] = computeMetricRange(duration);

			const params = new URLSearchParams({
				from_time: startAt.toISOString(),
				to_time: endAt.toISOString(),
			});

			return fetchAPI<CloudLogs>(withSearchParams(`/instances/${instance}/logs`, params));
		},
	});
}
