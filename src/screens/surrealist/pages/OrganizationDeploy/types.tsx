import type { Updater } from "use-immer";
import {
	CloudBackup,
	CloudDeployConfig,
	CloudInstance,
	CloudOrganization,
	StartingData,
} from "~/types";

export interface StepProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
	instances: CloudInstance[];
	backups?: CloudBackup[];
	setStep: (step: number) => void;
}

export interface DeploySectionProps {
	organisation: CloudOrganization;
	instances: CloudInstance[];
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
	backups?: CloudBackup[];
	baseInstance?: CloudInstance;
	setStep: (step: number) => void;
}

export interface StartingDataInfo {
	id: StartingData;
	title: string;
	description: string;
	icon: string;
}
