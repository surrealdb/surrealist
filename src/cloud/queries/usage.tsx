import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type { CloudLedgerEntry, CloudMeasurement } from "~/types";
import { withSearchParams } from "~/util/helpers";
import { fetchAPI } from "../api";

/**
 * Fetch organization spend breakdown for a billing period
 */
export function useCloudOrgSpendQuery(organization?: string, period?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "orgspend", organization, period],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudLedgerEntry[]>(
				withSearchParams(`/organizations/${organization}/spend`, { period }),
			);
		},
	});
}

/**
 * Fetch instance usage metrics
 */
export function useCloudUsageQuery(instance?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "usage", instance],
		enabled: !!instance && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudMeasurement[]>(`/instances/${instance}/usage`);
		},
	});
}
