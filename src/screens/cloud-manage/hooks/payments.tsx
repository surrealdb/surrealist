import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudPayment } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization payment details
 */
export function useCloudPayments(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "payments", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudPayment>(
				`/organizations/${organization}/payment`,
			);
		},
	});
}
