import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudOrganization } from "~/types";
import { fetchAPI } from "../api";

const DEFAULTS: Partial<CloudOrganization> = {
	billing_provider: "stripe",
	state: "created",
	user_role: "restricted_owner",
};

/**
 * Fetch organization details
 */
export function useCloudOrganizationQuery(organisation?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "organizations", { id: organisation }],
		refetchInterval: 15_000,
		enabled: !!organisation && authState === "authenticated",
		queryFn: async () => {
			return {
				...(await fetchAPI<CloudOrganization>(`/organizations/${organisation}`)),
				...DEFAULTS,
			} satisfies CloudOrganization;
		},
	});
}

/**
 * Fetch organization details
 */
export function useCloudOrganizationsQuery() {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "organizations"],
		refetchInterval: 15_000,
		enabled: authState === "authenticated",
		queryFn: async ({ client }) => {
			const organisations = (await fetchAPI<CloudOrganization[]>(`/organizations`)).map(
				(org) =>
					({
						...org,
						...DEFAULTS,
					}) satisfies CloudOrganization,
			);

			for (const org of organisations) {
				client.setQueryData(["cloud", "organizations", { id: org.id }], org);
			}

			return organisations;
		},
	});
}
