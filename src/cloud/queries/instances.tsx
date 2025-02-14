import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization instances
 */
export function useCloudOrganizationInstancesQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "instances", organization],
		refetchInterval: 15_000,
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInstance[]>(`/organizations/${organization}/instances`);
		},
	});
}
