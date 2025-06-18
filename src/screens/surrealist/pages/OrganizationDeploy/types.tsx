import type { Updater } from "use-immer";
import { CloudDeployConfig, CloudOrganization } from "~/types";

export interface DeploySectionProps {
	organisation: CloudOrganization;
	details: CloudDeployConfig;
	setDetails: Updater<CloudDeployConfig>;
}
