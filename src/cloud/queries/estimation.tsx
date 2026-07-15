import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuthentication } from "~/providers/Auth";
import { useHasCloudSession } from "~/providers/Cloud";
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
	const { isAuthenticated } = useAuthentication();
	const hasCloudSession = useHasCloudSession();

	return useQuery<Estimation | null>({
		queryKey: ["cloud", "estimation", config],
		enabled: organisation && config && isAuthenticated && hasCloudSession,
		placeholderData: keepPreviousData,
		queryFn: async () => {
			if (!organisation || !config || !config.computeType) {
				return null;
			}

			return await fetchAPI<Estimation>(`/instance_cost`, {
				method: "PUT",
				body: JSON.stringify(compileDeployConfig(organisation, config)),
			});
		},
	});
}
