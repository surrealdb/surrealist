import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudDataStore } from "~/types";

const MOCK_DATA_STORES: Record<string, CloudDataStore[]> = {};

function getMockDataStores(organization: string): CloudDataStore[] {
	if (!MOCK_DATA_STORES[organization]) {
		MOCK_DATA_STORES[organization] = [
			{
				id: `ds-${organization}-1`,
				name: "Production Store",
				state: "ready",
				region: "us-east-1",
				version: "2.0.0",
				organization_id: organization,
			},
			{
				id: `ds-${organization}-2`,
				name: "Staging Store",
				state: "ready",
				region: "eu-west-1",
				version: "2.0.0",
				organization_id: organization,
			},
			{
				id: `ds-${organization}-3`,
				name: "Development Store",
				state: "creating",
				region: "us-east-1",
				version: "2.0.0",
				organization_id: organization,
			},
		];
	}

	return MOCK_DATA_STORES[organization];
}

/**
 * Fetch organization data stores (mock implementation)
 */
export function useCloudOrganizationDataStoresQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "datastores", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			return getMockDataStores(organization as string);
		},
	});
}
