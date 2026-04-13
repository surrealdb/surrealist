import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudRole } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization member roles
 */
export function useCloudRolesQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "roles", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudRole[]>(`/organizations/${organization}/roles`);
		},
	});
}
