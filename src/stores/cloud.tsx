import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { CloudBillingCountry, CloudInstanceType, CloudProfile, CloudRegion } from "~/types";

interface CloudValues {
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	billingCountries: CloudBillingCountry[];
}

export const EMPTY_PROFILE: CloudProfile = {
	// username: "",
	// name: "",
	default_org: "",
	enabled_features: [],
};

export type CloudStore = {
	authError: string;
	sessionToken: string;
	authProvider: string;
	userId: string;
	isSupported: boolean;
	failedConnect: boolean;
	profile: CloudProfile;
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	billingCountries: CloudBillingCountry[];
	sessionExpired: boolean;
	onboardingRequired: boolean;
	cloudSessionActive: boolean;
	isProcessingAuth: boolean;
	chatLastResponse: string;

	setAuthError: (error: string) => void;
	setSessionToken: (token: string) => void;
	setUserId: (id: string) => void;
	setAuthProvider: (provider: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setIsSupported: (supported: boolean) => void;
	setFailedConnected: (failed: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setCloudSessionActive: (active: boolean) => void;
	setIsProcessingAuth: (processing: boolean) => void;
	setProfile: (profile: CloudProfile) => void;
	setSessionExpired: (expired: boolean) => void;
	setOnboardingRequired: (required: boolean) => void;
	clearSession: () => void;
};

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		authError: "",
		sessionToken: "",
		userId: "",
		authProvider: "",
		isSupported: true,
		failedConnect: false,
		profile: EMPTY_PROFILE,
		instanceTypes: [],
		instanceVersions: [],
		regions: [],
		billingCountries: [],
		sessionExpired: false,
		onboardingRequired: false,
		cloudSessionActive: false,
		isProcessingAuth: false,
		isProvisioning: false,
		isProvisionDone: false,
		provisioning: null,
		chatConversation: [],
		chatLastResponse: "",

		setAuthError: (error) =>
			set({
				authError: error,
			}),

		setSessionToken: (token) =>
			set({
				sessionToken: token,
			}),

		setUserId: (id) =>
			set({
				userId: id,
			}),

		setAuthProvider: (provider) =>
			set({
				authProvider: provider,
			}),

		setAccountProfile: (profile) =>
			set({
				profile,
			}),

		setIsSupported: (isSupported) =>
			set({
				isSupported,
			}),

		setCloudValues: (values) =>
			set({
				cloudSessionActive: true,
				...values,
			}),

		setCloudSessionActive: (active) =>
			set({
				cloudSessionActive: active,
			}),

		setIsProcessingAuth: (processing) =>
			set({
				isProcessingAuth: processing,
			}),

		setFailedConnected: (failed) =>
			set({
				failedConnect: failed,
			}),

		setProfile: (profile) =>
			set({
				profile,
			}),

		clearSession: () =>
			set({
				sessionToken: "",
				profile: EMPTY_PROFILE,
				onboardingRequired: false,
				cloudSessionActive: false,
			}),

		setSessionExpired: (expired) =>
			set({
				sessionExpired: expired,
			}),

		setOnboardingRequired: (required) =>
			set({
				onboardingRequired: required,
			}),
	})),
);
