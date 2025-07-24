import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";

export interface OrganizationUpdate {
	name?: string;
}

/**
 * Organization archive mutation
 */
export function useArchiveOrganizationMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			await fetchAPI(`/organizations/${organization}/archive`, {
				method: "PATCH",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		},
	});
}
