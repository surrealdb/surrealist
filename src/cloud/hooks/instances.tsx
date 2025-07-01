import { QueryObserverOptions, useQueries } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
import { fetchAPI } from "../api";
import { useCloudOrganizationsQuery } from "../queries/organizations";

/**
 * Fetch all instances for all organizations
 */
export function useCloudInstanceList() {
	const { data: organizations = [], isSuccess } = useCloudOrganizationsQuery();
	const authState = useCloudStore((state) => state.authState);

	return useQueries({
		queries: organizations.map(
			(org) =>
				({
					queryKey: ["cloud", "instances", { org: org.id, instances: true }],
					refetchInterval: 15_000,
					enabled: authState === "authenticated",
					queryFn: async ({ client }) => {
						const instances = await fetchAPI<CloudInstance[]>(
							`/organizations/${org.id}/instances`,
						);

						for (const instance of instances) {
							client.setQueryData(
								["cloud", "instances", { id: instance.id }],
								instance,
							);
						}

						return {
							organization: org,
							instances,
						};
					},
				}) satisfies QueryObserverOptions,
		),
		combine: (results) => ({
			isPending: !isSuccess || results.some((result) => result.isLoading),
			entries: results.filter((result) => !!result.data).map((result) => result.data),
		}),
	});
}
