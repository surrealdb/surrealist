import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAuthenticated } from "~/hooks/cloud";
import type {
	CloudContext,
	ContextApiKey,
	ContextPackage,
	OrganizationContextPackage,
} from "~/types";
import { fetchAPI } from "../api";

export function useCloudOrganizationContextsQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();
	const client = useQueryClient();

	return useQuery({
		queryKey: ["cloud", "contexts", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && isAuthenticated,
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
	const isAuthenticated = useIsAuthenticated();
	const client = useQueryClient();

	const cachedOrg =
		organization ??
		client.getQueryData<CloudContext>(["cloud", "context", contextId])?.organization_id;

	return useQuery({
		queryKey: ["cloud", "context", contextId],
		enabled: !!contextId && !!cachedOrg && isAuthenticated,
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
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "context", contextId, "api-keys"],
		enabled: !!organization && !!contextId && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<ContextApiKey[]>(
				`/organizations/${organization}/spectron_contexts/${contextId}/api_keys`,
			);
		},
	});
}

export function useContextPackagesQuery() {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "context-packages"],
		enabled: isAuthenticated,
		queryFn: async () => {
			return fetchAPI<ContextPackage[]>("/spectron_context_packages");
		},
	});
}

export function useOrganizationContextPackageQuery(organization?: string) {
	const isAuthenticated = useIsAuthenticated();

	return useQuery({
		queryKey: ["cloud", "context-packages", { org: organization }],
		enabled: !!organization && isAuthenticated,
		queryFn: async () => {
			return fetchAPI<OrganizationContextPackage[]>(
				`/organizations/${organization}/spectron_context_packages`,
			);
		},
	});
}
