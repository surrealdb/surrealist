import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";
import { tagEvent } from "~/util/analytics";

export interface Invitation {
	email: string;
	role: string;
}

/**
 * Member invitation mutation
 */
export function useInvitationMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async ({ email, role }: Invitation) => {
			await fetchAPI(`/organizations/${organization}/invitations`, {
				method: "POST",
				body: JSON.stringify({ email, role }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "invitations", organization],
			});

			tagEvent("cloud_organisation_member_invite", {
				organisation: organization,
				role,
			});
		},
	});
}

/**
 * Member revocation mutation
 */
export function useRevocationMutation(organization: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (code: string) => {
			await fetchAPI(`/organizations/${organization}/invitations/${code}`, {
				method: "DELETE",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "invitations", organization],
			});
		},
	});
}
