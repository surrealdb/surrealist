import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import { CloudOrganization } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization details
 */
export function useCloudOrganizationQuery(organisation?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "organizations", { id: organisation }],
		refetchInterval: 15_000,
		enabled: !!organisation && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudOrganization>(`/organizations/${organisation}`);
		},
	});
}

/**
 * Fetch organization details
 */
export function useCloudOrganizationsQuery() {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "organizations"],
		refetchInterval: 15_000,
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async ({ client }) => {
			const organisations = await fetchAPI<CloudOrganization[]>(`/organizations`);

			for (const org of organisations) {
				client.setQueryData(["cloud", "organizations", { id: org.id }], org);
			}

			return organisations;
		},
	});
}
