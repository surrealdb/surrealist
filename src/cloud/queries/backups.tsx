import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudBackup } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance backups
 */
export function useCloudBackupsQuery(instance?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "backups", instance],
		refetchInterval: 15_000,
		enabled: !!instance && authState === "authenticated",
		queryFn: async () => {
			const { db_backups } = await fetchAPI<{ db_backups?: CloudBackup[] }>(
				`/instances/${instance}/status`,
			);

			return db_backups ?? [];
		},
	});
}
