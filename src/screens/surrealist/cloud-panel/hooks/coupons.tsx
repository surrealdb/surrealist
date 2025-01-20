import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudCoupon } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch organization billing coupons
 */
export function useCloudCouponsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "coupons", organization],
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			const { coupons } = await fetchAPI<{ coupons: CloudCoupon[] }>(
				`/organizations/${organization}/billing/coupons`,
			);

			return coupons;
		},
	});
}
