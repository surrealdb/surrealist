import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext } from "~/types";

const MOCK_CONTEXTS: Record<string, CloudContext[]> = {};

function getMockContexts(organization: string): CloudContext[] {
	if (!MOCK_CONTEXTS[organization]) {
		MOCK_CONTEXTS[organization] = [
			// {
			// 	id: `ds-${organization}-1`,
			// 	name: "Production Context",
			// 	state: "ready",
			// 	region: "us-east-1",
			// 	version: "2.0.0",
			// 	organization_id: organization,
			// },
			{
				id: `ds-${organization}-2`,
				name: "Staging Context",
				state: "ready",
				region: "eu-west-1",
				version: "2.0.0",
				organization_id: organization,
			},
			{
				id: `ds-${organization}-3`,
				name: "Production Context",
				state: "ready",
				region: "us-east-1",
				version: "2.0.0",
				organization_id: organization,
			},
		];
	}

	return MOCK_CONTEXTS[organization];
}

/**
 * Fetch organization contexts (mock implementation)
 */
export function useCloudOrganizationContextsQuery(organization?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "contexts", { org: organization }],
		refetchInterval: 15_000,
		enabled: !!organization && authState === "authenticated",
		queryFn: async () => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			return getMockContexts(organization as string);
		},
	});
}
