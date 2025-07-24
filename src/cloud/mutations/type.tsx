import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeConnection } from "~/screens/surrealist/connection/connection";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";

/**
 * Instance type updating mutation
 */
export function useUpdateInstanceTypeMutation(instance: CloudInstance) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (slug: string) => {
			await fetchAPI(`/instances/${instance.id}/type`, {
				method: "PATCH",
				body: JSON.stringify({ slug }),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			closeConnection(true);

			tagEvent("cloud_instance_type_changed", {
				instance: instance.id,
				region: instance.region,
				version: instance.version,
				storage_size: instance.storage_size,
				organisation: instance.organization_id,
				old_instance_type: instance.type.slug,
				new_instance_type: slug,
			});
		},
	});
}
