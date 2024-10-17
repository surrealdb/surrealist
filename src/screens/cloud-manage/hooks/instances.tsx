import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization instances
 */
export function useCloudInstances(organization?: string) {
	const authState = useCloudStore((state) => state.authState);
	
	return useQuery({
		queryKey: ["cloud", "databases", organization],
		refetchInterval: 5_000,
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInstance[]>(`/organizations/${organization}/instances`);
		},
	});
}