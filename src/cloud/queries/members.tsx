import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession, useIsAuthenticated } from "~/hooks/cloud";
import type { CloudMember } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization members
 */
export function useCloudMembersQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "members", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudMember[]>(`/organizations/${organization}/members`);
		},
	});
}
