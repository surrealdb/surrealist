import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudRole } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization member roles
 */
export function useCloudRolesQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "roles", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudRole[]>(`/organizations/${organization}/roles`);
		},
	});
}
