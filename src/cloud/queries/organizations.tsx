import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import { CloudOrganization } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization details
 */
export function useCloudOrganizationQuery(organisation?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "organizations", { id: organisation }],
		refetchInterval: 15_000,
		enabled: !!organisation && isAuthenticated,
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

	return useQuery({
		queryKey: ["cloud", "organizations"],
		refetchInterval: 15_000,
		enabled: isAuthenticated,
		queryFn: async ({ client }) => {
			const organisations = await fetchAPI<CloudOrganization[]>(`/organizations`);

			for (const org of organisations) {
				client.setQueryData(["cloud", "organizations", { id: org.id }], org);
			}

			return organisations;
		},
	});
}
