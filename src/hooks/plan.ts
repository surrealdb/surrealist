import { useQuery } from "@tanstack/react-query";

export function usePlans() {
	return useQuery<Plan[]>({
		queryKey: ["plans"],
		queryFn: async () => {
			return fetch("https://surrealdb.com/api/cloud/pricing.json")
				.then((response) => response.json() as Promise<Plan[]>)
				.then((data) => data.map((plan) => ({
					...plan,
					features: plan.features.filter((feature) => !feature.includes("<span class='inline-block"))
				})));
		}
	});
}

export type PricingTypes =
	| 'cloud-free'
	| 'cloud-start'
	| 'cloud-scale'
	| 'cloud-enterprise';

interface PricingConfigComputePrice {
	node: string;
	type: 'Burstable' | 'General Purpose';
	cpu: string;
	memory: string;
	compute_price: string;
}

interface PricingConfigStoragePrice {
	storage: string;
	price: string;
}

interface Plan {
	id: PricingTypes;
	name: string;
	description: string;
	price: string | number;
	features: string[];
	featuresTitle: string;
	resources: string[];
	plus?: string[];
	computePrice?: PricingConfigComputePrice[];
	storagePrice?: PricingConfigStoragePrice[];
}