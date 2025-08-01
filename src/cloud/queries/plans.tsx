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
	coming_soon_features: boolean[];
	resources: string[];
}

export interface PlanConfig {
	plan: InstancePlan;
	name: string;
	description: string;
	price: string | number;
	features: { name: string; comingSoon: boolean }[];
	resources: string[];
	dataset: boolean;
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
						resources: plan.resources,
						dataset: plan.surrealist.dataset,
						defaultType: plan.surrealist.defaultType,
						features: plan.features.map((feature, i) => ({
							name: feature,
							comingSoon: plan.coming_soon_features?.[i] ?? false,
						})),
					}) as PlanConfig,
			);
		},
	});
}
