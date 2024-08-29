import { create } from "zustand";
import { AuthState, CloudBillingCountry, CloudInstanceType, CloudOrganization, CloudProfile, CloudRegion } from "~/types";

interface CloudValues {
	profile: CloudProfile;
	instanceTypes: CloudInstanceType[];
	instanceVersions: string[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	billingCountries: CloudBillingCountry[]
}

export const EMPTY_PROFILE: CloudProfile = {
	username: "",
	default_org: "",
	name: "",
};

export type CloudStore = {
	authState: AuthState;
	sessionToken: string;
	profile: CloudProfile;
	instanceTypes: CloudInstanceType[];
	instanceVersions: string[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	billingCountries: CloudBillingCountry[];
	sessionExpired: boolean;

	setLoading: () => void;
	setSessionToken: (token: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setCloudValues: (values: CloudValues) => void;
	setSessionExpired: (expired: boolean) => void;
	clearSession: () => void;
};

export const useCloudStore = create<CloudStore>((set) => ({
	authState: "unknown",
	sessionToken: "",
	profile: EMPTY_PROFILE,
	instanceTypes: [],
	instanceVersions: [],
	regions: [],
	organizations: [],
	billingCountries: [],
	sessionExpired: false,

	setLoading: () => set({ authState: "loading" }),

	setSessionToken: (token) => set({
		sessionToken: token,
	}),

	setAccountProfile: (profile) => set({
		profile,
	}),

	setCloudValues: (values) => set({
		authState: "authenticated",
		...values
	}),

	clearSession: () => set({
		authState: "unauthenticated",
		sessionToken: "",
		profile: EMPTY_PROFILE,
	}),

	setSessionExpired: (expired) => set({
		sessionExpired: expired,
	}),


}));
