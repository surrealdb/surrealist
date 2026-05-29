import type { CloudProfile } from "~/types";

export const EMPTY_PROFILE: CloudProfile = {
	default_org: "",
	enabled_features: [],
};

export interface CloudSessionStatus {
	isActive: boolean;
	isLoading: boolean;
}

export interface CloudContext {
	error: string;
	isActive: boolean;
	isLoading: boolean;
	sessionToken: string;
	userId: string;
	authProvider: string;
	profile: CloudProfile;
	syncCloudProfile: () => Promise<void>;
	syncCloudResources: () => Promise<void>;
}
