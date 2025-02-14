import { useQueries } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch all instances for all organizations
 */
export function useCloudInstanceList() {
	const organizations = useCloudStore((s) => s.organizations);
	const authState = useCloudStore((state) => state.authState);

	return useQueries({
		queries: organizations.map((org) => ({
			queryKey: ["cloud", "org-instances", org.id],
			refetchInterval: 15_000,
			enabled: authState === "authenticated",
			queryFn: async () => ({
				organization: org,
				instances: await fetchAPI<CloudInstance[]>(`/organizations/${org.id}/instances`),
			}),
		})),
		combine: (results) => ({
			isPending: results.some((result) => result.isLoading),
			entries: results.filter((result) => !!result.data).map((result) => result.data),
		}),
	});
}
