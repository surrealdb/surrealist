import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import type { CloudBilling } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing details
 */
export function useCloudBillingQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "billing", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudBilling>(`/organizations/${organization}/billing`);
		},
	});
}
