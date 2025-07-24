import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudMember } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization members
 */
export function useCloudMembersQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "members", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudMember[]>(`/organizations/${organization}/members`);
		},
	});
}
