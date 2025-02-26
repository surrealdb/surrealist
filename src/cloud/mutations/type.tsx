import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";

/**
 * Instance type updating mutation
 */
export function useUpdateInstanceTypeMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (slug: string) => {
			await fetchAPI(`/instances/${instance}/type`, {
				method: "PATCH",
				body: JSON.stringify({ slug }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});
}
