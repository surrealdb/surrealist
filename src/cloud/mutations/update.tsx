import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";

export interface OrganizationUpdate {
	name?: string;
}

/**
 * Organization update mutation
 */
export function useUpdateOrganizationMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({ name }: OrganizationUpdate) => {
			await fetchAPI(`/organizations/${organization}`, {
				method: "PATCH",
				body: JSON.stringify({
					name,
				}),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		},
	});
}
