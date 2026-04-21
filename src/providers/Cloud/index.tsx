import { showNotification } from "@mantine/notifications";
import { Icon, iconCheck, useStable } from "@surrealdb/ui";
import {
	createContext,
	type PropsWithChildren,
	useContext,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { adapter } from "~/adapter";
import { ApiError, fetchAPI } from "~/cloud/api";
import { isClientSupported } from "~/cloud/api/version";
import { useCloudStore } from "~/stores/cloud";
import type {
	CloudBillingCountry,
	CloudInstanceType,
	CloudProfile,
	CloudRegion,
	CloudSignin,
} from "~/types";
import { tagEvent } from "~/util/analytics";
import { CloudAuthEvent, CloudExpiredEvent } from "~/util/global-events";
import { exposeDebug, showErrorNotification } from "~/util/helpers";
import { AWS_MARKETPLACE_KEY, INVITATION_KEY, REFERRER_KEY } from "~/util/storage";
import { useAuthentication } from "../Auth";

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

const CloudSessionContext = createContext<CloudContext | null>(null);

let _current: CloudContext | null = null;

/**
 * Current cloud API bearer token. Returns empty string when no CloudProvider is mounted.
 */
export function getCloudSessionToken(): string {
	return _current?.sessionToken ?? "";
}

/**
 * Current cloud user id (for analytics). Returns empty string when no CloudProvider is mounted.
 */
export function getCloudUserId(): string {
	return _current?.userId ?? "";
}

/**
 * Readonly cloud session status for imperative gating (e.g. `openConnection`).
 */
export function getCloudSessionStatus(): CloudSessionStatus {
	return {
		isActive: _current?.isActive ?? false,
		isLoading: _current?.isLoading ?? false,
	};
}

/**
 * SurrealDB Cloud session state and actions. Must be used within a {@link CloudProvider}.
 */
export function useCloud(): CloudContext {
	const ctx = useContext(CloudSessionContext);

	if (!ctx) {
		throw new Error("useCloud must be used within a CloudProvider");
	}

	return ctx;
}

export function CloudProvider({ children }: PropsWithChildren) {
	const { isAuthenticated, isLoading: isAuthLoading, getAccessToken } = useAuthentication();
	const { setOnboardingRequired, setIsSupported, setFailedConnected, setCloudValues } =
		useCloudStore.getState();

	const [error, setError] = useState("");
	const [isActive, setIsActive] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [sessionToken, setSessionToken] = useState("");
	const [userId, setUserId] = useState("");
	const [authProvider, setAuthProvider] = useState("");
	const [profile, setProfile] = useState<CloudProfile>(EMPTY_PROFILE);

	const invalidateSession = useStable(() => {
		adapter.log("Cloud", "Invalidating session");

		setOnboardingRequired(false);
		setSessionToken("");
		setProfile(EMPTY_PROFILE);
		setIsActive(false);

		CloudExpiredEvent.dispatch(null);
	});

	const syncCloudProfile = useStable(async () => {
		const profile = await fetchAPI<CloudProfile>("/user/profile");
		setProfile(profile);
		adapter.log("Cloud", "Synchronised cloud profile");
	});

	const syncCloudResources = useStable(async () => {
		const [instanceVersions, instanceTypes, instanceRegions, contextRegions, billingCountries] =
			await Promise.all([
				fetchAPI<string[]>("/instanceversions"),
				fetchAPI<CloudInstanceType[]>("/instancetypes"),
				fetchAPI<CloudRegion[]>("/regions"),
				fetchAPI<CloudRegion[]>("/context_regions"),
				fetchAPI<CloudBillingCountry[]>("/billingcountries"),
			]);

		setCloudValues({
			instanceVersions,
			instanceTypes,
			instanceRegions,
			contextRegions,
			billingCountries,
		});
	});

	const acquireSession = useStable(async (initial: boolean) => {
		try {
			if (initial) {
				setIsLoading(true);
			}

			const versionResponse = await isClientSupported();

			if (versionResponse instanceof Error) {
				console.error(`Failed to fetch Cloud Version: ${versionResponse.message}`);
				setFailedConnected(true);
				return;
			}

			if (!versionResponse) {
				setIsSupported(false);
				return;
			}

			const accessToken = await getAccessToken();

			const referralCode = sessionStorage.getItem(REFERRER_KEY);
			const invitationCode = sessionStorage.getItem(INVITATION_KEY);
			const awsMarketplaceCode = sessionStorage.getItem(AWS_MARKETPLACE_KEY);

			adapter.log("Cloud", "Acquiring cloud session");

			const params = new URLSearchParams();

			if (referralCode) {
				params.append("referral", referralCode);
			}

			if (invitationCode) {
				params.append("invitation", invitationCode);
			}

			if (awsMarketplaceCode) {
				params.append("aws_token", awsMarketplaceCode);
			}

			const result = await fetchAPI<CloudSignin>(`/signin?${params}`, {
				method: "POST",
				body: JSON.stringify(accessToken),
			});

			setError("");
			setSessionToken(result.token);
			setAuthProvider(result.provider);
			setUserId(result.id);
			setIsActive(true);

			const promptTerms = !result.terms_accepted_at;

			if (promptTerms) {
				setOnboardingRequired(true);
			}

			adapter.log("Cloud", "Session acquired");
			CloudAuthEvent.dispatch(null);

			if (initial) {
				tagEvent("cloud_signin", {
					auth_provider: result.provider,
					referred: !!referralCode,
					open_terms: promptTerms,
					first_signin: promptTerms,
				});
			}

			if (invitationCode) {
				showNotification({
					color: "violet",
					title: "Invitation accepted",
					message: "You have joined the organisation",
					icon: <Icon path={iconCheck} />,
				});
			}
		} catch (err: unknown) {
			console.error("Failed to acquire session", err);

			const message = err instanceof Error ? err.message : String(err);

			setError(message);
			invalidateSession();

			if (err instanceof ApiError && err.status === 422) {
				showErrorNotification({
					title: "Already in organisation",
					content: "You are already a member of this organisation",
				});
			} else {
				showErrorNotification({
					title: "Failed to authenticate",
					content: "Please try signing into SurrealDB Cloud again",
				});
			}
		} finally {
			if (initial) {
				setIsLoading(false);
			}

			sessionStorage.removeItem(REFERRER_KEY);
			sessionStorage.removeItem(INVITATION_KEY);
			sessionStorage.removeItem(AWS_MARKETPLACE_KEY);
		}
	});

	const checkSessionExpiry = useStable(() => {
		const token = sessionToken;

		if (!token) {
			return;
		}

		const parts = token.split(".");

		if (parts.length !== 3) {
			throw new Error("Invalid JWT token");
		}

		const expiry = JSON.parse(atob(parts[1])).exp;

		if (!expiry) {
			return;
		}

		const now = Date.now() / 1000;

		if (expiry - now < 300) {
			void acquireSession(false);
		}
	});

	useLayoutEffect(() => {
		const interval = setInterval(checkSessionExpiry, 1000 * 60 * 3);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (isAuthLoading) {
			return;
		}

		if (isAuthenticated) {
			void acquireSession(true);

			return () => {
				invalidateSession();
			};
		}
	}, [isAuthenticated, isAuthLoading]);

	useEffect(() => {
		if (isActive) {
			void syncCloudProfile();
			void syncCloudResources();
		}
	}, [isActive]);

	useEffect(() => {
		exposeDebug({
			invalidateSession,
		});
	}, []);

	const value = useMemo<CloudContext>(
		() => ({
			error,
			isActive,
			isLoading,
			sessionToken,
			userId,
			authProvider,
			profile,
			syncCloudProfile,
			syncCloudResources,
		}),
		[error, isActive, isLoading, sessionToken, userId, authProvider, profile],
	);

	useLayoutEffect(() => {
		_current = value;

		return () => {
			_current = null;
		};
	}, [value]);

	return <CloudSessionContext.Provider value={value}>{children}</CloudSessionContext.Provider>;
}
