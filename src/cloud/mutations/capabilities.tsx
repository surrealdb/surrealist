import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "../api";
import { CloudInstanceCapabilities } from "~/types";

/**
 * Instance capabilities updating mutation
 */
export function useUpdateInstanceCapabilitiesMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (capabilities: CloudInstanceCapabilities) => {
			await fetchAPI(`/instances/${instance}/capabilities`, {
				method: "PUT",
				body: JSON.stringify(capabilities),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});
		},
	});
}
