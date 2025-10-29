import { useQuery } from "@tanstack/react-query";
import { useCloudStore } from "~/stores/cloud";
import { CloudSupportPlanResult } from "~/types";
import { fetchAPI } from "../api";

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
