import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudMember } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization members
 */
export function useCloudMembersQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "members", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudMember[]>(`/organizations/${organization}/members`);
		},
	});
}
