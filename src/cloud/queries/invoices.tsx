import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import type { CloudInvoice } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing invoices
 */
export function useCloudInvoicesQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "invoices", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudInvoice[]>(`/organizations/${organization}/billing/invoices`);
		},
	});
}
