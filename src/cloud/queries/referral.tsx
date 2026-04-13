import { useQuery } from "@tanstack/react-query";
import { useCloudProfile, useIsAuthenticated } from "~/hooks/cloud";
import { fetchAPI } from "../api";

/**
 * Fetch referral statistics
 */
export function useCloudReferralQuery() {
	const isAuthenticated = useIsAuthenticated();
	const { username } = useCloudProfile();

	return useQuery({
		queryKey: ["cloud", "referral", username],
		enabled: isAuthenticated,
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
	const isAuthenticated = useIsAuthenticated();
	const { username } = useCloudProfile();

	return useQuery({
		queryKey: ["cloud", "referral-code", username],
		enabled: isAuthenticated,
		queryFn: async () => {
			return fetchAPI<string>(`/user/referrals/code`);
		},
	});
}
