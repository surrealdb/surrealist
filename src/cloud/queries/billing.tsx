import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudBilling } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing details
 */
export function useCloudBillingQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "billing", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudBilling>(`/organizations/${organization}/billing`);
		},
	});
}
