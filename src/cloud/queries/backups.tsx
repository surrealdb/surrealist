import { useQuery } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/auth";
import { useHasCloudSession } from "~/hooks/cloud";
import { CloudBackup } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance backups
 */
export function useCloudBackupsQuery(instance?: string) {
	const isAuthenticated = useIsAuthenticated();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "backups", instance],
		refetchInterval: 15_000,
		enabled: !!instance && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const { db_backups } = await fetchAPI<{ db_backups?: CloudBackup[] }>(
				`/instances/${instance}/status`,
			);

			return db_backups ?? [];
		},
	});
}
