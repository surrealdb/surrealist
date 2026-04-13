import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudMeasurement } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization usage metrics
 */
export function useCloudOrgUsageQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "orgusage", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudMeasurement[]>(`/organizations/${organization}/usage`);
		},
	});
}

/**
 * Fetch instance usage metrics
 */
export function useCloudUsageQuery(instance?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "usage", instance],
		enabled: !!instance && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudMeasurement[]>(`/instances/${instance}/usage`);
		},
	});
}
