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
	/** True after sign-in when the API reports terms not yet accepted; cleared when the user accepts in the onboarding modal. */
	termsAcceptancePending: boolean;
	isProvisioning: boolean;
	isProvisionDone: boolean;
	provisioning: unknown;
	chatConversation: unknown[];
	chatLastResponse: string;

	setIsSupported: (supported: boolean) => void;
	setFailedConnected: (failed: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setTermsAcceptancePending: (pending: boolean) => void;
};

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		isSupported: true,
		failedConnect: false,
		instanceTypes: [],
		instanceVersions: [],
		instanceRegions: [],
		contextRegions: [],
		billingCountries: [],
		termsAcceptancePending: false,
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

		setTermsAcceptancePending: (pending) =>
			set({
				termsAcceptancePending: pending,
			}),
	})),
);
