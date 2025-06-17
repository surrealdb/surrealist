import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudDeployConfig, CloudOrganization } from "~/types";
import { fetchAPI } from "../api";
import { compileDeployConfig } from "../helpers";

interface Estimation {
	currency: string;
	currency_symbol: string;
	cost: number;
}

/**
 * Fetch instance details
 */
export function useCloudEstimationQuery(
	organisation?: CloudOrganization,
	config?: CloudDeployConfig,
) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery<Estimation | null>({
		queryKey: ["cloud", "estimation", config],
		enabled: organisation && config && authState === "authenticated",
		queryFn: async () => {
			console.log("Fetching estimation for", organisation, config);

			if (!organisation || !config || !config.type) {
				return null;
			}

			return await fetchAPI<Estimation>(`/instance_cost`, {
				method: "POST",
				body: JSON.stringify(compileDeployConfig(organisation, config)),
			});
		},
	});
}
