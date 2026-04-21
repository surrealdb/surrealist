import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type { CloudRole } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization member roles
 */
export function useCloudRolesQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "roles", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudRole[]>(`/organizations/${organization}/roles`);
		},
	});
}
