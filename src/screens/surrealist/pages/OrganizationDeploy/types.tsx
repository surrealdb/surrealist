import type { Updater } from "use-immer";
import { CloudDeployConfig, CloudOrganization } from "~/types";

export interface StepProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
	setStep: (step: number) => void;
}

export interface DeploySectionProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
}
