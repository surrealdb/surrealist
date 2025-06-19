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
				compute_type: config.type,
				organisation: organisation.id,
				cluster: config.cluster,
			});

			return [instance, connection] as const;
		},
	});
}
