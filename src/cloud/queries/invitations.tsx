import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInvitation } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch pending organization invitation
 */
export function useCloudInvitationsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "invitations", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInvitation[]>(`/organizations/${organization}/invitations`);
		},
	});
}
