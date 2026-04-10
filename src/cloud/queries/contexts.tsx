import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext, ContextApiKey } from "~/types";
import { fetchAPI } from "../api";

export function useCloudOrganizationContextsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);
	const client = useQueryClient();

	return useQuery({
		queryKey: ["cloud", "contexts", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			const contexts = await fetchAPI<CloudContext[]>(
				`/organizations/${organization}/spectron_contexts`,
			);

			for (const ctx of contexts) {
				client.setQueryData(["cloud", "context", ctx.id], ctx);
			}

			return contexts;
		},
	});
}

export function useCloudContextQuery(organization?: string, contextId?: string) {
	const authState = useCloudStore((state) => state.authState);
	const client = useQueryClient();

	const cachedOrg =
		organization ??
		client.getQueryData<CloudContext>(["cloud", "context", contextId])?.organization_id;

	return useQuery({
		queryKey: ["cloud", "context", contextId],
		enabled: !!contextId && !!cachedOrg && authState === "authenticated",
		queryFn: async () => {
			const org = cachedOrg;

			if (!org) {
				throw new Error("Organization ID is required to fetch a context");
			}

			return fetchAPI<CloudContext>(`/organizations/${org}/spectron_contexts/${contextId}`);
		},
	});
}

export function useCloudContextApiKeysQuery(organization?: string, contextId?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "context", contextId, "api-keys"],
		enabled: !!organization && !!contextId && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<ContextApiKey[]>(
				`/organizations/${organization}/spectron_contexts/${contextId}/api_keys`,
			);
		},
	});
}
