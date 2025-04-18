import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeConnection } from "~/screens/surrealist/connection/connection";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";

/**
 * Instance version updating mutation
 */
export function useUpdateInstanceVersionMutation(instance: string | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (version: string) => {
			await fetchAPI(`/instances/${instance}/version`, {
				method: "PATCH",
				body: JSON.stringify({ version }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			closeConnection(true);

			tagEvent("cloud_instance_version_updated", {
				instance,
				version,
			});
		},
	});
}
