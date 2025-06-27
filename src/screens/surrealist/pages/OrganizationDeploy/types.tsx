import type { Updater } from "use-immer";
import { CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";

export interface StepProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
	instances: CloudInstance[];
	setStep: (step: number) => void;
}

export interface DeploySectionProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
}
