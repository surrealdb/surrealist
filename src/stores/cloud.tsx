import { shake } from "radash";
import { create } from "zustand";
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

/*
const [threadId, setThreadId] = useState<string | undefined>(undefined);
	const [input, setInput] = useInputState("");
	const [conversation, setConversation] = useState<Message[]>([]);
	const [lastResponse, setLastResponse] = useState("");
*/

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
	chatThreadId: string;
	chatConversation: CloudChatMessage[];
	chatLastResponse: string;

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
	setChatThreadId: (threadId: string) => void;
	pushChatMessage: (message: CloudChatMessage) => void;
	clearChatSession: () => void;
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
	chatThreadId: "",
	chatConversation: [],
	chatLastResponse: "",

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

	setChatThreadId: (threadId) =>
		set({
			chatThreadId: threadId,
		}),

	pushChatMessage: (message) =>
		set((state) =>
			shake({
				chatConversation: [...state.chatConversation, message],
				chatLastResponse: message.sender === "bot" ? message.id : undefined,
			}),
		),

	clearChatSession: () =>
		set({
			chatThreadId: "",
			chatConversation: [],
			chatLastResponse: "",
		}),
}));
