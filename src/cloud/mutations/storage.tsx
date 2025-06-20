import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { fetchAPI } from "../api";

/**
 * Storage size updating mutation
 */
export function useUpdateInstanceStorageMutation(instance: CloudInstance) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (size: number) => {
			await fetchAPI(`/instances/${instance.id}/storagesize`, {
				method: "PATCH",
				body: JSON.stringify({
					storage_size_gb: size,
				}),
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			tagEvent("cloud_instance_storage_changed", {
				instance: instance.id,
				region: instance.region,
				version: instance.version,
				organisation: instance.organization_id,
				instance_type: instance.type.slug,
				old_storage_size: instance.storage_size,
				new_storage_size: size,
			});
		},
	});
}
