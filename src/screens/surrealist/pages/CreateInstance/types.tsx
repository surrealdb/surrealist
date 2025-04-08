import type { Updater } from "use-immer";

export interface ProvisionConfig {
	organization: string;
	name: string;
	version: string;
	region: string;
	type: string;
	units: number;
}

export interface ProvisionStepProps {
	details: ProvisionConfig;
	setDetails: Updater<ProvisionConfig>;
}
