import { useMutation } from "@tanstack/react-query";
import { CloudInstance } from "~/types";
import { fetchAPI } from "../api";

/**
 * Fetch instance backups
 */
export function useCloudAuthTokenMutation(instance?: string | CloudInstance) {
	const id = typeof instance === "string" ? instance : instance?.id;
	return useMutation({
		mutationFn: async () => {
			if (!id) return undefined;
			return await fetchAPI<{ token: string }>(`/instances/${id}/auth`).then(
				(res) => res.token,
			);
		},
	});
}
