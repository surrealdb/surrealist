import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
	AuthState,
	CloudBillingCountry,
	CloudInstanceType,
	CloudProfile,
	CloudRegion,
} from "~/types";

interface CloudValues {
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	billingCountries: CloudBillingCountry[];
}

export const EMPTY_PROFILE: CloudProfile = {
	username: "",
	name: "",
	default_org: "",
	enabled_features: [],
};

export type CloudStore = {
	authState: AuthState;
	authError: string;
	accessToken: string;
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
	chatLastResponse: string;

	setLoading: () => void;
	setAuthError: (error: string) => void;
	setAccessToken: (token: string) => void;
	setSessionToken: (token: string) => void;
	setUserId: (id: string) => void;
	setAuthProvider: (provider: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setIsSupported: (supported: boolean) => void;
	setFailedConnected: (failed: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setProfile: (profile: CloudProfile) => void;
	setSessionExpired: (expired: boolean) => void;
	clearSession: () => void;
};

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		authState: "unknown",
		authError: "",
		accessToken: "",
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
		isProvisioning: false,
		isProvisionDone: false,
		provisioning: null,
		chatConversation: [],
		chatLastResponse: "",

		setLoading: () => set({ authState: "loading" }),

		setAuthError: (error) =>
			set({
				authError: error,
			}),

		setAccessToken: (token) =>
			set({
				accessToken: token,
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
				authState: "authenticated",
				...values,
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
				authState: "unauthenticated",
				sessionToken: "",
				profile: EMPTY_PROFILE,
			}),

		setSessionExpired: (expired) =>
			set({
				sessionExpired: expired,
			}),
	})),
);
