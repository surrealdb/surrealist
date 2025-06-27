import { useQuery } from "@tanstack/react-query";
import { objectify } from "radash";
import { InstancePlan } from "~/types";

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
	dataset: boolean;
	defaultType?: string;
}

export function useCloudPlansQuery() {
	return useQuery({
		queryKey: ["plans"],
		queryFn: async () => {
			const response = await fetch("http://localhost:4321/api/cloud/pricing.json");
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
						dataset: plan.surrealist.dataset,
						defaultType: plan.surrealist.defaultType,
					}) as PlanConfig,
			);
		},
	});
}
