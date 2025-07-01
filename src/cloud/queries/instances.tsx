import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance details
 */
export function useCloudInstanceQuery(instance?: string, interval?: number) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "instances", { id: instance }],
		refetchInterval: interval ?? 15_000,
		enabled: !!instance && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInstance>(`/instances/${instance}`);
		},
	});
}

/**
 * Fetch organization instances
 */
export function useCloudOrganizationInstancesQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "instances", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && authState === "authenticated",
		queryFn: async ({ client }) => {
			const instances = await fetchAPI<CloudInstance[]>(
				`/organizations/${organization}/instances`,
			);

			for (const instance of instances) {
				client.setQueryData(["cloud", "instances", { id: instance.id }], instance);
			}

			return instances;
		},
	});
}
