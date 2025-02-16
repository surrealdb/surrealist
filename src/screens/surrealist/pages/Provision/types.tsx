import type { Updater } from "use-immer";

export interface ProvisionConfig {
	name: string;
	version: string;
	region: string;
	category: string;
	type: string;
	units: number;
}

export interface ProvisionStepProps {
	details: ProvisionConfig;
	setDetails: Updater<ProvisionConfig>;
}
