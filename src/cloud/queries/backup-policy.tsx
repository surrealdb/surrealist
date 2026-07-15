import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import { CloudBackupPolicyResponse } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance backup policy
 */
export function useCloudBackupPolicyQuery(instance?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "backup-policy", { id: instance }],
		enabled: !!instance && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudBackupPolicyResponse>(`/instances/${instance}/backuppolicy`);
		},
	});
}
