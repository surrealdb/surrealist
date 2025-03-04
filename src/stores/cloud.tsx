import type {
	AuthState,
	CloudBillingCountry,
	CloudChatMessage,
	CloudInstance,
	CloudInstanceType,
	CloudOrganization,
	CloudProfile,
	CloudRegion,
} from "~/types";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { newId } from "~/util/helpers";

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
};

export type CloudStore = {
	authState: AuthState;
	sessionToken: string;
	authProvider: string;
	userId: string;
	isSupported: boolean;
	profile: CloudProfile;
	instanceVersions: string[];
	instanceTypes: CloudInstanceType[];
	regions: CloudRegion[];
	organizations: CloudOrganization[];
	selectedOrganization: string;
	billingCountries: CloudBillingCountry[];
	sessionExpired: boolean;
	isProvisioning: boolean;
	isProvisionDone: boolean;
	provisioning: CloudInstance | null;
	chatConversation: CloudChatMessage[];
	chatLastResponse: string;

	setLoading: () => void;
	setSessionToken: (token: string) => void;
	setUserId: (id: string) => void;
	setAuthProvider: (provider: string) => void;
	setAccountProfile: (profile: CloudProfile) => void;
	setIsSupported: (supported: boolean) => void;
	setCloudValues: (values: CloudValues) => void;
	setProfile: (profile: CloudProfile) => void;
	setSelectedOrganization: (id: string) => void;
	setSessionExpired: (expired: boolean) => void;
	setProvisioning: (instance: CloudInstance) => void;
	finishProvisioning: () => void;
	hideProvisioning: () => void;
	clearSession: () => void;
	pushChatMessage: (message: CloudChatMessage) => void;
	completeChatResponse: (id: string) => void;
	updateChatMessage: (id: string, fn: (state: CloudChatMessage) => void) => void;
	clearChatSession: () => void;
};

export const useCloudStore = create<CloudStore>()(
	immer((set) => ({
		authState: "unknown",
		sessionToken: "",
		userId: "",
		authProvider: "",
		isSupported: true,
		profile: EMPTY_PROFILE,
		instanceTypes: [],
		instanceVersions: [],
		regions: [],
		organizations: [],
		selectedOrganization: "",
		billingCountries: [],
		sessionExpired: false,
		isProvisioning: false,
		isProvisionDone: false,
		provisioning: null,
		chatConversation: [],
		chatLastResponse: "",

		setLoading: () => set({ authState: "loading" }),

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

		setSelectedOrganization: (id) =>
			set({
				selectedOrganization: id,
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
