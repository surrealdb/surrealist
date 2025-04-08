import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudOrganization } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization details
 */
export function useCloudOrganizationsQuery() {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "organizations"],
		refetchInterval: 15_000,
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudOrganization[]>(`/organizations`);
		},
	});
}
