import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CloudContext, ContextApiKey, OrganizationContextPackage } from "~/types";
import { fetchAPI } from "../api";

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

export interface CreateContextApiKeyRequest {
	name: string;
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

export function useCreateContextApiKeyMutation(
	organization: string | undefined,
	contextId: string | undefined,
) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (body: CreateContextApiKeyRequest) => {
			if (!organization || !contextId) {
				throw new Error("Organization and context ID are required");
			}

			const result = await fetchAPI<ContextApiKey>(
				`/organizations/${organization}/spectron_contexts/${contextId}/api_keys`,
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
