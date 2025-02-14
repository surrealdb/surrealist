import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInvoice } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing invoices
 */
export function useCloudInvoicesQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "invoices", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInvoice[]>(`/organizations/${organization}/billing/invoices`);
		},
	});
}
