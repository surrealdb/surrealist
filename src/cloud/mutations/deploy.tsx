import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";
import { tagEvent } from "~/util/analytics";
import { resolveInstanceConnection } from "~/util/connection";
import { fetchAPI } from "../api";
import { compileDeployConfig } from "../helpers";

export interface OrganizationUpdate {
	name?: string;
}

/**
 * Instance deploy mutation
 */
export function useInstanceDeployMutation(
	organisation: CloudOrganization,
	config: CloudDeployConfig,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			const configuration = compileDeployConfig(organisation, config);
			const instance = await fetchAPI<CloudInstance>("/instances", {
				method: "POST",
				body: JSON.stringify(configuration),
			});

			const connection = resolveInstanceConnection(instance);

			queryClient.setQueryData(["cloud", "instances", { id: instance.id }], instance);

			tagEvent("cloud_instance_created", {
				instance: instance.id,
				region: config.region,
				version: config.version,
				instance_type: instance.type.slug,
				storage_size: instance.storage_size,
				organisation: organisation.id,
				dataset: config.dataset,
			});

			return [instance, connection] as const;
		},
	});
}
