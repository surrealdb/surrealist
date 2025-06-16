import type { Updater } from "use-immer";
import { CloudInstanceType, CloudOrganization } from "~/types";

export type StorageCategory = "standard" | "advanced";

export interface DeployConfig {
	name: string;
	version: string;
	region: string;
	type: CloudInstanceType | null;
	units: number;
	storageCategory: StorageCategory;
	storageAmount: number;
}

export interface DeploySectionProps {
	organisation: CloudOrganization;
	details: DeployConfig;
	setDetails: Updater<DeployConfig>;
}
