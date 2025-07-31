import type { Updater } from "use-immer";
import {
	CloudBackup,
	CloudDeployConfig,
	CloudInstance,
	CloudOrganization,
	StartingDataType,
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
}

export interface StartingData {
	id: StartingDataType;
	title: string;
	description: string;
	icon: string;
}
