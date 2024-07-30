import { create } from "zustand";
import { AuthState, CloudInstanceType, CloudOrganization, CloudProfile, CloudRegion } from "~/types";

interface CloudValues {
	profile: CloudProfile;
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
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
	regions: CloudRegion[];
	organizations: CloudOrganization[];
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
	regions: [],
	organizations: [],
	sessionExpired: false,

	setLoading: () => set({ authState: "loading" }),

	setSessionToken: (token) => set({
		sessionToken: token,
	}),

	setAccountProfile: (profile) => set({
		profile,
	}),

	setCloudValues: ({profile, instanceTypes, regions, organizations}) => set({
		authState: "authenticated",
		profile,
		instanceTypes,
		regions,
		organizations,
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
