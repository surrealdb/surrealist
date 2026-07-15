import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import type { CloudInvoice } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing invoices
 */
export function useCloudInvoicesQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "invoices", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudInvoice[]>(`/organizations/${organization}/billing/invoices`);
		},
	});
}
