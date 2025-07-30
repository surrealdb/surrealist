import type { Updater } from "use-immer";
import { CloudBackup, CloudDeployConfig, CloudInstance, CloudOrganization } from "~/types";

export interface StepProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
	instances: CloudInstance[];
	backups?: CloudBackup[];
	baseInstance?: CloudInstance;
	setStep: (step: number) => void;
}

export interface DeploySectionProps {
	organisation: CloudOrganization;
	backups?: CloudBackup[];
	baseInstance?: CloudInstance;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
}
