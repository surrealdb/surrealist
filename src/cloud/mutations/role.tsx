import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";

export interface RoleUpdate {
	userId: string;
	role: string;
}

/**
 * Member role updating mutation
 */
export function useUpdateRoleMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({ userId, role }: RoleUpdate) => {
			await fetchAPI(`/organizations/${organization}/members/${userId}`, {
				method: "PATCH",
				body: JSON.stringify({ role }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "members", organization],
			});

			tagEvent("cloud_organisation_member_role", {
				organisation: organization,
			});
		},
	});
}
