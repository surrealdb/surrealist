import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudInvitation } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch pending organization invitation
 */
export function useCloudInvitationsQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "invitations", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudInvitation[]>(`/organizations/${organization}/invitations`);
		},
	});
}
