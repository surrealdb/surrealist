import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import type { CloudMember } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization members
 */
export function useCloudMembersQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "members", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudMember[]>(`/organizations/${organization}/members`);
		},
	});
}
