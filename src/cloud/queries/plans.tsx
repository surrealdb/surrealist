import { useQuery } from "@tanstack/react-query";
import { objectify } from "radash";
import { InstancePlan } from "~/types";

export interface InstancePlanComputePrice {
	node: string;
	type: "Burstable" | "General Purpose";
	cpu: string;
	memory: string;
	compute_price: string;
}

export interface InstancePlanStoragePrice {
	storage: string;
	price: string;
}

export interface InstancePlanSurrealist {
	dataset: boolean;
	defaultType?: string;
	plan: string;
}

export interface InstancePlanInfo {
	id: InstancePlan;
	name: string;
	description: string;
	surrealist: InstancePlanSurrealist;
	price: string | number;
	features: string[];
	featuresTitle: string;
	resources: string[];
	plus?: string[];
	computePrice?: InstancePlanComputePrice[];
	storagePrice?: InstancePlanStoragePrice[];
}

export function useCloudPlansQuery() {
	return useQuery({
		queryKey: ["plans"],
		queryFn: async () => {
			const response = await fetch("http://localhost:4321/api/cloud/pricing.json");
			const plans: InstancePlanInfo[] = await response.json();

			return objectify(
				plans,
				(plan) => plan.surrealist.plan as InstancePlan,
				(plan) => plan,
			);
		},
	});
}
