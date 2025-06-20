import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeConnection } from "~/screens/surrealist/connection/connection";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";
import { CloudInstance } from "~/types";

/**
 * Instance version updating mutation
 */
export function useUpdateInstanceVersionMutation(instance: CloudInstance | undefined) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (version: string) => {
			await fetchAPI(`/instances/${instance?.id}/version`, {
				method: "PATCH",
				body: JSON.stringify({ version }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			closeConnection(true);

			if (instance) {
				tagEvent("cloud_instance_version_updated", {
					instance: instance.id,
					region: instance.region,
					instance_type: instance.type.slug,
					storage_size: instance.storage_size,
					organisation: instance.organization_id,
					old_version: instance.version,
					new_version: version,
				});
			}
		},
	});
}
