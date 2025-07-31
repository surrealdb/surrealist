import { useQuery } from "@tanstack/react-query";
import { objectify } from "radash";
import { InstancePlan, StartingDataDetails } from "~/types";

interface PlanResponse {
	name: string;
	description: string;
	surrealist: {
		plan: InstancePlan;
		dataset?: boolean;
		defaultType?: string;
	};
	price: string | number;
	features: string[];
	resources: string[];
}

export interface PlanConfig {
	plan: InstancePlan;
	name: string;
	description: string;
	price: string | number;
	features: string[];
	resources: string[];
	startingData: StartingDataDetails;
	defaultType?: string;
}

export function useCloudPlansQuery() {
	return useQuery({
		queryKey: ["cloud", "plans"],
		queryFn: async () => {
			const response = await fetch("https://surrealdb.com/api/cloud/pricing.json");
			const plans: PlanResponse[] = await response.json();

			return objectify(
				plans,
				(plan) => plan.surrealist.plan as InstancePlan,
				(plan) =>
					({
						plan: plan.surrealist.plan,
						name: plan.name,
						description: plan.description,
						price: plan.price,
						features: plan.features,
						resources: plan.resources,
						defaultType: plan.surrealist.defaultType,
						startingData: {
							type: plan.surrealist.dataset ? "dataset" : "none",
							dataset: "surreal-deal-store-mini",
						},
					}) as PlanConfig,
			);
		},
	});
}
