import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type { CloudInvitation } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch pending organization invitation
 */
export function useCloudInvitationsQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "invitations", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudInvitation[]>(`/organizations/${organization}/invitations`);
		},
	});
}
