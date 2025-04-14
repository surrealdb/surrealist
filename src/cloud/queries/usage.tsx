import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudMeasurement } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization usage metrics
 */
export function useCloudOrgUsageQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "orgusage", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudMeasurement[]>(`/organizations/${organization}/usage`);
		},
	});
}

/**
 * Fetch instance usage metrics
 */
export function useCloudUsageQuery(instance?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "usage", instance],
		enabled: !!instance && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudMeasurement[]>(`/instances/${instance}/usage`);
		},
	});
}
