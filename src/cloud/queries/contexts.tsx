import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useHasCloudSession } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import type {
	CloudContext,
	ContextApiKey,
	ContextPackage,
	OrganizationContextPackage,
	SpectronAccessToken,
	SpectronContextConfig,
	SpectronContextUsage,
	SpectronPrincipal,
	SpectronProviders,
	SpectronScope,
} from "~/types";
import { fetchAPI } from "../api";

const spectronBase = (organization: string, contextId: string) =>
	`/organizations/${organization}/spectron_contexts/${contextId}`;

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
		// Contexts are provisioned asynchronously; poll while one is still
		// being created so the page advances to ready on its own.
		refetchInterval: (query) => (query.state.data?.state === "creating" ? 5_000 : false),
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

/**
 * Mints (via POST) a Cloud-brokered, TTL-bounded access token for the calling
 * user's own principal inside the given context. The token is used to
 * authenticate the Spectron SDK. Cached and refetched ahead of expiry by the
 * {@link SpectronProvider}.
 */
export function useSpectronAccessTokenQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "access-token"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		// Tokens are short-lived; refresh roughly every 50 minutes by default.
		// (The provider also schedules a refresh from `expires_at` when present.)
		refetchInterval: 50 * 60_000,
		retry: 1,
		queryFn: async () => {
			return fetchAPI<SpectronAccessToken>(
				`${spectronBase(organization as string, contextId as string)}/access_tokens`,
				{
					method: "POST",
					body: JSON.stringify({}),
				},
			);
		},
	});
}

export function useCloudContextPrincipalsQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "principals"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<SpectronPrincipal[]>(
				`${spectronBase(organization as string, contextId as string)}/principals`,
			);
		},
	});
}

export function useCloudContextScopesQuery(
	organization?: string,
	contextId?: string,
	under?: string,
) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "scopes", under ?? null],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			const query = under ? `?under=${encodeURIComponent(under)}` : "";
			return fetchAPI<SpectronScope[]>(
				`${spectronBase(organization as string, contextId as string)}/scopes${query}`,
			);
		},
	});
}

export function useCloudContextUsageQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "usage"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<SpectronContextUsage>(
				`${spectronBase(organization as string, contextId as string)}/usage`,
			);
		},
	});
}

export function useCloudContextProvidersQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "providers"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		staleTime: 5 * 60_000,
		queryFn: async () => {
			return fetchAPI<SpectronProviders>(
				`${spectronBase(organization as string, contextId as string)}/providers`,
			);
		},
	});
}

export function useCloudContextConfigQuery(organization?: string, contextId?: string) {
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery({
		queryKey: ["cloud", "context", organization, contextId, "config"],
		enabled: !!organization && !!contextId && isAuthenticated && hasCloudSession,
		queryFn: async () => {
			return fetchAPI<SpectronContextConfig>(
				`${spectronBase(organization as string, contextId as string)}/config`,
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
