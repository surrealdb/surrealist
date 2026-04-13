import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type { CloudInvoice } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing invoices
 */
export function useCloudInvoicesQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "invoices", organization],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<CloudInvoice[]>(`/organizations/${organization}/billing/invoices`);
		},
	});
}
