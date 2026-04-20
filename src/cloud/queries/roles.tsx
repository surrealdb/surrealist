import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import type { CloudRole } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization member roles
 */
export function useCloudRolesQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "roles", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudRole[]>(`/organizations/${organization}/roles`);
		},
	});
}
