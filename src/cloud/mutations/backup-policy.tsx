import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpdateBackupPolicyRequest } from "~/types";
import { fetchAPI } from "../api";

/**
 * Instance backup policy updating mutation
 */
export function useUpdateInstanceBackupPolicyMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (policy: CloudUpdateBackupPolicyRequest) => {
			await fetchAPI(`/instances/${instance}/backuppolicy`, {
				method: "PATCH",
				body: JSON.stringify(policy),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "backup-policy"],
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});
}
