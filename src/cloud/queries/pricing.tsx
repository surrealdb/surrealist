import { useQuery } from "@tanstack/react-query";
import { useSetting } from "~/hooks/config";
import { InstancePlan } from "~/types";
import { useFeatureFlags } from "~/util/feature-flags";
import { getWebsiteBase } from "../api/endpoints";

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
	dataset?: PricingConfigDataset;
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
}

export interface PricingResult {
	cloud: PricingConfigCloud[];
	selfHosted: PricingConfigBase[];
	support: PricingConfigBase[];
}

export function useCloudPricingQuery() {
	const [{ website_base }] = useFeatureFlags();
	const [websiteSetting] = useSetting("cloud", "urlWebsiteBase");

	return useQuery({
		queryKey: ["cloud", "pricing", website_base, websiteSetting],
		queryFn: async () => {
			const response = await fetch(`${getWebsiteBase()}/api/cloud/pricing.json`);
			const plans: PricingResult = await response.json();

			return plans;
		},
	});
}
