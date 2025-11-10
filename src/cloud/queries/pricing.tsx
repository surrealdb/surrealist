import { useQuery } from "@tanstack/react-query";
import { InstancePlan } from "~/types";

type PricingConfigCTA =
	| {
			variant: "reversed" | "gradient";
			text: string;
			href: string;
	  }
	| {
			variant: "disabled";
			text: string;
	  };

export interface PricingConfigBase {
	id: string;
	name: string;
	description: string;
	price: string | number | undefined;
	features: PricingConfigFeature[];
	coming_soon_features?: boolean[];
	featuresTitle: string;
	cta: PricingConfigCTA;
	plus?: string[];
	surrealist?: PricingConfigSurrealist;
	computePrice?: PricingConfigComputePrice[];
	storagePrice?: PricingConfigStoragePrice[];
}

export interface PricingConfigComputePrice {
	node: string;
	type: string;
	cpu: string;
	memory: string;
	compute_price: string;
}

export interface PricingConfigStoragePrice {
	storage: string;
	price: string;
}

interface PricingConfigSurrealist {
	plan: InstancePlan;
	defaultType?: string;
}

export interface PricingConfigDataset {
	id: string;
	version?: string;
	size?: string;
}

export interface PricingConfigFeature {
	name: string;
	comingSoon: true;
}

export interface PricingConfigCloud extends PricingConfigBase {
	resources: string[];
	dataset: PricingConfigDataset | null;
}

export interface PricingResult {
	cloud: PricingConfigCloud[];
	selfHosted: PricingConfigBase[];
	support: PricingConfigBase[];
}

export function useCloudPricingQuery() {
	return useQuery({
		queryKey: ["cloud", "pricing"],
		queryFn: async () => {
			const response = await fetch("http://localhost:4321/api/cloud/pricing.json");
			const plans: PricingResult = await response.json();

			console.log(plans);

			return plans;
		},
	});
}
