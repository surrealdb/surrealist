import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { fetchAPI } from "../api";

/**
 * Fetch personal referral code
 */
export function useCloudReferralQuery() {
	const authState = useCloudStore((state) => state.authState);
	const username = useCloudStore((state) => state.profile.username);

	return useQuery({
		queryKey: ["cloud", "referral", username],
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<string>(`/user/referrals/code`);
		},
	});
}
