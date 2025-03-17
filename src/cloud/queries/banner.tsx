import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudBanner } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch the active alert banner
 */
export function useCloudBannerQuery() {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "banner"],
		enabled: authState === "authenticated",
		queryFn: async () => {
			const response = await fetchAPI<CloudBanner | CloudBanner[]>(`/message`);

			return Array.isArray(response) ? response : [response];
		},
	});
}
