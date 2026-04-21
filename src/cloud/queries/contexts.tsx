import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type {
	CloudContext,
	ContextApiKey,
	ContextPackage,
	OrganizationContextPackage,
} from "~/types";
import { fetchAPI } from "../api";

export function useCloudOrganizationContextsQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();
	const client = useQueryClient();

	return useQuery({
		queryKey: ["cloud", "contexts", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const contexts = await fetchAPI<CloudContext[]>(
				`/organizations/${organization}/spectron_contexts`,
			);

			for (const ctx of contexts) {
				client.setQueryData(["cloud", "context", organization, ctx.id], ctx);
			}

			return contexts;
		},
	});
}

export function useCloudContextQuery(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();
	const client = useQueryClient();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const ctx = await fetchAPI<CloudContext>(
				`/organizations/${organization}/spectron_contexts/${contextId}`,
			);
			client.setQueryData(["cloud", "context", organization, contextId], ctx);
			return ctx;
		},
	});
}

export function useCloudContextApiKeysQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "api-keys"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<ContextApiKey[]>(
				`/organizations/${organization}/spectron_contexts/${contextId}/api_keys`,
			);
		},
	});
}

export function useContextPackagesQuery() {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context-packages"],
		enabled: isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<ContextPackage[]>("/spectron_context_packages");
		},
	});
}

export function useOrganizationContextPackageQuery(organization?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context-packages", { org: organization }],
		enabled: !!organization && isAuthenticated && hasCloudSession,
		staleTime: 30_000,
		queryFn: async () => {
			return fetchAPI<OrganizationContextPackage[]>(
				`/organizations/${organization}/spectron_context_packages`,
			);
		},
	});
}
