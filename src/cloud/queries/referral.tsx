import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import { fetchAPI } from "../api";

/**
 * Fetch referral statistics
 */
export function useCloudReferralQuery() {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();
	const { user } = useAuthentication();

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
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();
	const { user } = useAuthentication();

	return useQuery({
		queryKey: ["cloud", "referral-code", user?.email],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<string>(`/user/referrals/code`);
		},
	});
}
