import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import type { CloudCoupon } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing coupons
 */
export function useCloudCouponsQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "coupons", organization],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const { coupons } = await fetchAPI<{ coupons: CloudCoupon[] }>(
				`/organizations/${organization}/billing/coupons`,
			);

			return coupons;
		},
	});
}
