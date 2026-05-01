import { useQuery } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type { CloudPayment } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization payment details
 */
export function useCloudPaymentsQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "payments", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudPayment>(`/organizations/${organization}/payment`);
		},
	});
}
