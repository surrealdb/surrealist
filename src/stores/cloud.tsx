import { create } from "zustand";
import type {
	AuthState,
	CloudBillingCountry,
	CloudInstance,
	CloudInstanceType,
	CloudOrganization,
	CloudProfile,
	CloudRegion,
} from "~/types";

interface CloudValues {
	profile: CloudProfile;
	instanceVersions: string[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	billingCountries: CloudBillingCountry[];
}

export const EMPTY_PROFILE: CloudProfile = {
	username: "",
	default_org: "",
	name: "",
};

export type CloudStore = {
	authState: AuthState;
	sessionToken: string;
	isSupported: boolean;
	profile: CloudProfile;
	instanceVersions: string[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	billingCountries: CloudBillingCountry[];
	sessionExpired: boolean;
	isProvisioning: boolean;
	isProvisionDone: boolean;
	provisioning: CloudInstance | null;

	setLoading: () => void;
	setSessionToken: (token: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setIsSupported: (supported: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setSessionExpired: (expired: boolean) => void;
	setProvisioning: (instance: CloudInstance) => void;
	finishProvisioning: () => void;
	hideProvisioning: () => void;
	clearSession: () => void;
};

export const useCloudStore = create<CloudStore>((set) => ({
	authState: "unknown",
	sessionToken: "",
	isSupported: true,
	profile: EMPTY_PROFILE,
	instanceTypes: [],
	instanceVersions: [],
	regions: [],
	organizations: [],
	billingCountries: [],
	sessionExpired: false,
	isProvisioning: false,
	isProvisionDone: false,
	provisioning: null,

	setLoading: () => set({ authState: "loading" }),

	setSessionToken: (token) =>
		set({
			sessionToken: token,
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

	setProvisioning: (instance) =>
		set({
			isProvisioning: true,
			isProvisionDone: false,
			provisioning: instance,
		}),

	finishProvisioning: () =>
		set({
			isProvisionDone: true,
		}),

	hideProvisioning: () =>
		set({
			isProvisioning: false,
		}),
}));
