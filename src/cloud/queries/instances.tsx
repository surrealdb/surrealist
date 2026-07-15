import { useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
import { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance details
 */
export function useCloudInstanceQuery(instance?: string, interval?: number) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "instances", { id: instance }],
		refetchInterval: interval ?? 15_000,
		enabled: !!instance && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<CloudInstance>(`/instances/${instance}`);
		},
	});
}

/**
 * Fetch organization instances
 */
export function useCloudOrganizationInstancesQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "instances", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && isAuthenticated && hasCloudSession,
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
