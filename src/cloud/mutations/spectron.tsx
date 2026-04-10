import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CloudContext, ContextApiKey } from "~/types";
import { fetchAPI } from "../api";

export interface CreateContextRequest {
	name: string;
	region: string;
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

			client.invalidateQueries({
				queryKey: ["cloud", "contexts"],
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
				queryKey: ["cloud", "context", contextId, "api-keys"],
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
				queryKey: ["cloud", "context", contextId, "api-keys"],
			});
		},
	});
}
