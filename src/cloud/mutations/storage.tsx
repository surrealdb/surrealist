import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";

/**
 * Storage size updating mutation
 */
export function useUpdateInstanceStorageMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (size: number) => {
			await fetchAPI(`/instances/${instance}/storagesize`, {
				method: "PATCH",
				body: JSON.stringify({
					storage_size_gb: size,
				}),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});
}
