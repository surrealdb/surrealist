import type { Updater } from "use-immer";

export type StorageMode = "standalone" | "distributed";
export type StorageCategory = "standard" | "advanced";

export interface ProvisionConfig {
	organization: string;
	name: string;
	version: string;
	region: string;
	type: string;
	units: number;
	storageMode: StorageMode;
	storageCategory: StorageCategory;
	storageAmount: number;
}

export interface ProvisionStepProps {
	details: ProvisionConfig;
	setDetails: Updater<ProvisionConfig>;
}
