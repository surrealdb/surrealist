import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudOrganization, CloudSupportPlanResult } from "~/types";
import { fetchAPI } from "../api";
import { hasOrganizationRole } from "../helpers";

export function useCloudSupportPlansQuery(organisation?: string) {
	const authState = useCloudStore((state) => state.authState);

	return useQuery({
		queryKey: ["cloud", "organisation", organisation, "support_plan"],
		enabled: !!organisation && authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudSupportPlanResult[]>(
				`/organizations/${organisation}/support_plans`,
			);
		},
	});
}

export function useOrganisationsWithSupportPlanQuery(
	organisations?: CloudOrganization[],
	requireAccess?: boolean,
) {
	return useQuery({
		queryKey: ["cloud", "organisations", "with_support_plan"],
		enabled: !!organisations,
		queryFn: async () => {
			const organisationsWithSupportPlan: CloudOrganization[] = [];

			for (const organisation of organisations || []) {
				const supportPlans = await fetchAPI<CloudSupportPlanResult[]>(
					`/organizations/${organisation.id}/support_plans`,
				);

				if (supportPlans.length > 0 && getActiveSupportPlan(supportPlans) !== null) {
					if (
						(requireAccess && hasOrganizationRole(organisation, "admin")) ||
						!requireAccess
					) {
						organisationsWithSupportPlan.push(organisation);
					}
				}
			}

			return organisationsWithSupportPlan;
		},
	});
}

export function getActiveSupportPlan(supportPlans?: CloudSupportPlanResult[]) {
	const plans = supportPlans?.filter((plan) => plan.enabled_at && !plan.disabled_at);

	if (!plans || plans?.length === 0) {
		return null;
	}

	if (plans.length === 1) {
		return plans[0];
	}

	return plans.sort(
		(a, b) => new Date(b.enabled_at).getTime() - new Date(a.enabled_at).getTime(),
	)[0];
}

export function useActiveSupportPlanQuery(organisation?: string) {
	const { data: supportPlans } = useCloudSupportPlansQuery(organisation);

	return useQuery({
		queryKey: ["cloud", "organisation", organisation, "active_support_plan"],
		enabled: !!organisation && !!supportPlans,
		queryFn: () => getActiveSupportPlan(supportPlans),
	});
}
