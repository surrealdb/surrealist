import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
	CloudContext,
	ContextApiKey,
	OrganizationContextPackage,
	SpectronGrants,
	SpectronPrincipal,
	SpectronPrincipalKind,
} from "~/types";
import { fetchAPI } from "../api";

const spectronBase = (organization: string, contextId: string) =>
	`/organizations/${organization}/spectron_contexts/${contextId}`;

export interface CreateContextRequest {
	name: string;
	region: string;
}

export interface UpdateContextRequest {
	id: string;
	body: {
		name?: string;
	};
}

export function useCreateContextMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: CreateContextRequest) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			const result = await fetchAPI<CloudContext>(
				`/organizations/${organization}/spectron_contexts`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			client.setQueryData(["cloud", "context", organization, result.id], result);

			client.invalidateQueries({
				queryKey: ["cloud", "contexts"],
			});

			return result;
		},
	});
}

export function useUpdateContextMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (request: UpdateContextRequest) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			const result = await fetchAPI<CloudContext>(
				`/organizations/${organization}/spectron_contexts/${request.id}`,
				{
					method: "PATCH",
					body: JSON.stringify(request.body),
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context", organization, request.id],
			});

			return result;
		},
	});
}

export function useDeleteContextMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (contextId: string) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			await fetchAPI(`/organizations/${organization}/spectron_contexts/${contextId}`, {
				method: "DELETE",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "contexts"],
			});
		},
	});
}

export function useDeleteContextApiKeyMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (apiKeyId: string) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			await fetchAPI(
				`/organizations/${organization}/spectron_contexts/${contextId}/api_keys/${apiKeyId}`,
				{
					method: "DELETE",
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context", organization, contextId, "api-keys"],
			});
		},
	});
}

// ─── Principals, grants, scoped keys (admin / Cloud control plane) ───

export interface CreatePrincipalRequest {
	kind: SpectronPrincipalKind;
	display_name: string;
	grants?: SpectronGrants;
}

export interface UpdatePrincipalRequest {
	principalId: string;
	body: {
		kind?: SpectronPrincipalKind;
		display_name?: string;
	};
}

export interface MintScopedKeyRequest {
	name: string;
	principal_id: string;
	grants?: SpectronGrants;
	ttl_seconds?: number;
}

export interface AddContextUserRequest {
	user_id: string;
}

function invalidatePrincipals(
	client: ReturnType<typeof useQueryClient>,
	organization: string,
	contextId: string,
) {
	client.invalidateQueries({
		queryKey: ["cloud", "context", organization, contextId, "principals"],
	});
}

export function useCreatePrincipalMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: CreatePrincipalRequest) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<SpectronPrincipal>(
				`${spectronBase(organization, contextId)}/principals`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			invalidatePrincipals(client, organization, contextId);
			return result;
		},
	});
}

export function useUpdatePrincipalMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({ principalId, body }: UpdatePrincipalRequest) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<SpectronPrincipal>(
				`${spectronBase(organization, contextId)}/principals/${principalId}`,
				{
					method: "PATCH",
					body: JSON.stringify(body),
				},
			);

			invalidatePrincipals(client, organization, contextId);
			return result;
		},
	});
}

export function useDeletePrincipalMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (principalId: string) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			await fetchAPI(`${spectronBase(organization, contextId)}/principals/${principalId}`, {
				method: "DELETE",
			});

			invalidatePrincipals(client, organization, contextId);
		},
	});
}

export function useReplacePrincipalGrantsMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({
			principalId,
			grants,
		}: {
			principalId: string;
			grants: SpectronGrants;
		}) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<SpectronPrincipal>(
				`${spectronBase(organization, contextId)}/principals/${principalId}/grants`,
				{
					method: "PUT",
					body: JSON.stringify({ grants }),
				},
			);

			invalidatePrincipals(client, organization, contextId);
			return result;
		},
	});
}

export function useMintScopedKeyMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: MintScopedKeyRequest) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<ContextApiKey>(
				`${spectronBase(organization, contextId)}/scoped_keys`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context", organization, contextId, "api-keys"],
			});
			return result;
		},
	});
}

export function useRotateContextApiKeyMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (apiKeyId: string) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<ContextApiKey>(
				`${spectronBase(organization, contextId)}/api_keys/${apiKeyId}/rotate`,
				{
					method: "POST",
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context", organization, contextId, "api-keys"],
			});
			return result;
		},
	});
}

export function useAddContextUserMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: AddContextUserRequest) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			await fetchAPI(`${spectronBase(organization, contextId)}/users`, {
				method: "POST",
				body: JSON.stringify(body),
			});

			invalidatePrincipals(client, organization, contextId);
		},
	});
}

export interface AssignContextPackageVariables {
	packageId: string;
	coupon_code?: string;
}

export function useAssignContextPackageMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({ packageId, coupon_code }: AssignContextPackageVariables) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			const body: { package_id: string; coupon_code?: string } = {
				package_id: packageId,
			};

			const trimmed = coupon_code?.trim();
			if (trimmed) {
				body.coupon_code = trimmed;
			}

			const result = await fetchAPI<OrganizationContextPackage>(
				`/organizations/${organization}/spectron_context_packages`,
				{
					method: "POST",
					body: JSON.stringify(body),
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context-packages", { org: organization }],
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});

			return result;
		},
	});
}

export function useCancelContextPackageMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (organizationPackageId: string) => {
			if (!organization) {
				throw new Error("Organization is required");
			}

			await fetchAPI(
				`/organizations/${organization}/spectron_context_packages/${organizationPackageId}/cancel`,
				{
					method: "POST",
				},
			);

			client.invalidateQueries({
				queryKey: ["cloud", "context-packages", { org: organization }],
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		},
	});
}
