import type {
	AuthState,
	CloudBillingCountry,
	CloudChatMessage,
	CloudInstanceType,
	CloudOrganization,
	CloudProfile,
	CloudRegion,
} from "~/types";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface CloudValues {
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
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
	sessionToken: string;
	authProvider: string;
	userId: string;
	isSupported: boolean;
	profile: CloudProfile;
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	billingCountries: CloudBillingCountry[];
	sessionExpired: boolean;
	chatConversation: CloudChatMessage[];
	chatLastResponse: string;

	setLoading: () => void;
	setAuthError: (error: string) => void;
	setSessionToken: (token: string) => void;
	setUserId: (id: string) => void;
	setAuthProvider: (provider: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setIsSupported: (supported: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setProfile: (profile: CloudProfile) => void;
	setSessionExpired: (expired: boolean) => void;
	clearSession: () => void;
	pushChatMessage: (message: CloudChatMessage) => void;
	completeChatResponse: (id: string) => void;
	updateChatMessage: (id: string, fn: (state: CloudChatMessage) => void) => void;
	clearChatSession: () => void;
};

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		authState: "unknown",
		authError: "",
		sessionToken: "",
		userId: "",
		authProvider: "",
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
		chatConversation: [],
		chatLastResponse: "",

		setLoading: () => set({ authState: "loading" }),

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
				authState: "authenticated",
				...values,
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

		pushChatMessage: (message) =>
			set((state) => {
				state.chatConversation.push(message);
			}),

		updateChatMessage: (id, updater) =>
			set((state) => {
				const msgIndex = state.chatConversation.findLastIndex((m) => m.id === id);

				if (msgIndex >= 0) {
					updater(state.chatConversation[msgIndex]);
				}
			}),

		completeChatResponse: (id) =>
			set({
				chatLastResponse: id,
			}),

		clearChatSession: () =>
			set({
				chatConversation: [],
				chatLastResponse: "",
			}),
	})),
);
