import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";

/**
 * Member removal mutation
 */
export function useRemoveMemberMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (userId: string) => {
			await fetchAPI(`/organizations/${organization}/members/${userId}`, {
				method: "DELETE",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "members", organization],
			});

			tagEvent("cloud_organisation_member_remove", {
				organisation: organization,
			});
		},
	});
}
