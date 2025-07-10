import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudInstance } from "~/types";
import { fetchAPI } from "../api";
import { tagEvent } from "~/util/analytics";

export function useUpdateInstanceNodeMutation(instance: CloudInstance) {
	const client = useQueryClient();

	return useMutation({
		mutationFn: async (units: number) => {

			await fetchAPI(`/instances/${instance.id}/computeunits`, {
				method: "PATCH",
				body: JSON.stringify({
					compute_units: units,
				})
			});

			client.invalidateQueries({
				queryKey: ["cloud", "instances"],
			});

			tagEvent("cloud_instance_compute_nodes_changed", {
				instance: instance.id,
				region: instance.region,
				version: instance.version,
				organisation: instance.organization_id,
				instance_type: instance.type.slug,
				storage_size: instance.storage_size,
				old_compute_units: instance.compute_units,
				new_compute_units: units,
			});
		}
	});
}