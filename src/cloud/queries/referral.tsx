import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { fetchAPI } from "../api";

/**
 * Fetch referral statistics
 */
export function useCloudReferralQuery() {
	const authState = useCloudStore((state) => state.authState);
	const username = useCloudStore((state) => state.profile.username);

	return useQuery({
		queryKey: ["cloud", "referral", username],
		enabled: authState === "authenticated",
		queryFn: async () => {
			const { users_referred } = await fetchAPI<{ users_referred: number }>(
				`/user/referrals`,
			);

			return users_referred;
		},
	});
}

/**
 * Fetch personal referral code
 */
export function useCloudReferralCodeQuery() {
	const authState = useCloudStore((state) => state.authState);
	const username = useCloudStore((state) => state.profile.username);

	return useQuery({
		queryKey: ["cloud", "referral-code", username],
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<string>(`/user/referrals/code`);
		},
	});
}
