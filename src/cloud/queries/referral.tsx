import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import { fetchAPI } from "../api";

/**
 * Fetch referral statistics
 */
export function useCloudReferralQuery() {
	const { user, isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "referral", user?.email],
		enabled: isAuthenticated && hasCloudSession,
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
	const { user, isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "referral-code", user?.email],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<string>(`/user/referrals/code`);
		},
	});
}
