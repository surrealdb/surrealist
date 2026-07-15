import { useQuery } from "@tanstack/react-query";
import { isEmpty } from "radash";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import type { CloudBanner } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch the active alert banner
 */
export function useCloudBannerQuery() {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "banner"],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const response = await fetchAPI<CloudBanner | CloudBanner[]>(`/message`);
			const banners = Array.isArray(response) ? response : [response];

			return banners.filter((banner) => !isEmpty(banner));
		},
	});
}
