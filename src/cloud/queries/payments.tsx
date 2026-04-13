import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudPayment } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization payment details
 */
export function useCloudPaymentsQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "payments", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudPayment>(`/organizations/${organization}/payment`);
		},
	});
}
