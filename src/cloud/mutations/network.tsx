import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudInstanceAccessType } from "~/types";
import { fetchAPI } from "../api";

/**
 * Instance access type updating mutation
 */
export function useUpdateInstanceAccessTypeMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (accessType: CloudInstanceAccessType) => {
			await fetchAPI(`/instances/${instance}/access_type`, {
				method: "PATCH",
				body: JSON.stringify({ access_type: accessType }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});
}
