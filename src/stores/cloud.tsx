import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CloudBillingCountry, CloudInstanceType, CloudRegion } from "~/types";

export interface CloudValues {
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	instanceRegions: CloudRegion[];
	contextRegions: CloudRegion[];
	billingCountries: CloudBillingCountry[];
}

export type CloudStore = {
	isSupported: boolean;
	failedConnect: boolean;
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	instanceRegions: CloudRegion[];
	contextRegions: CloudRegion[];
	billingCountries: CloudBillingCountry[];
	onboardingRequired: boolean;
	isProvisioning: boolean;
	isProvisionDone: boolean;
	provisioning: unknown;
	chatConversation: unknown[];
	chatLastResponse: string;

	setIsSupported: (supported: boolean) => void;
	setFailedConnected: (failed: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setOnboardingRequired: (required: boolean) => void;
};

// /** Full cloud snapshot for desktop multi-window sync (legacy field names on the wire). */
// export type CloudSyncPayload = {
// 	isSupported: boolean;
// 	failedConnect: boolean;
// 	instanceVersions: string[];
// 	instanceTypes: CloudInstanceType[];
// 	instanceRegions: CloudRegion[];
// 	contextRegions: CloudRegion[];
// 	billingCountries: CloudBillingCountry[];
// 	onboardingRequired: boolean;
// 	isProvisioning: boolean;
// 	isProvisionDone: boolean;
// 	provisioning: unknown;
// 	chatConversation: unknown[];
// 	chatLastResponse: string;
// 	authError: string;
// 	sessionToken: string;
// 	userId: string;
// 	authProvider: string;
// 	profile: CloudProfile;
// 	sessionExpired: boolean;
// 	cloudSessionActive: boolean;
// 	isProcessingAuth: boolean;
// };

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		isSupported: true,
		failedConnect: false,
		instanceTypes: [],
		instanceVersions: [],
		instanceRegions: [],
		contextRegions: [],
		billingCountries: [],
		onboardingRequired: false,
		isProvisioning: false,
		isProvisionDone: false,
		provisioning: null,
		chatConversation: [],
		chatLastResponse: "",

		setIsSupported: (isSupported) =>
			set({
				isSupported,
			}),

		setCloudValues: (values) =>
			set({
				...values,
			}),

		setFailedConnected: (failed) =>
			set({
				failedConnect: failed,
			}),

		setOnboardingRequired: (required) =>
			set({
				onboardingRequired: required,
			}),
	})),
);
