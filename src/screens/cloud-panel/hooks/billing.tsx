import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudBilling } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing details
 */
export function useCloudBilling(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "billing", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudBilling>(`/organizations/${organization}/billing`);
		},
	});
}
